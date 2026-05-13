const chokidar = require('chokidar');
const mm = require('music-metadata');
const db = require('./db');
const path = require('path');
const fs = require('fs');

const SUPPORTED_EXTENSIONS = /\.(mp3|flac|wav|m4a|ogg|opus)$/i;

/**
 * Reads lyrics from:
 * 1. A .lrc or .txt file with the same name as the audio file (priority)
 * 2. A shared canciones.txt in the same folder, using song title as section header
 *
 * canciones.txt format:
 *   --- Song Title ---
 *   Lyrics line 1
 *   Lyrics line 2
 *   (blank line separates songs)
 *
 * @param {string} audioPath - Absolute path to the audio file
 * @param {string} [songTitle] - Song title to search inside canciones.txt
 * @returns {string|null} Lyrics text or null if not found
 */
function findLyrics(audioPath, songTitle) {
  const dir = path.dirname(audioPath);
  const audioBase = path.basename(audioPath, path.extname(audioPath));
  const audioFullName = path.basename(audioPath);

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if ((file.startsWith(audioBase) || file.startsWith(audioFullName)) && (file.endsWith('.lrc') || file.endsWith('.txt'))) {
        // Exclude the audio file itself if it's somehow named .txt
        if (file !== audioFullName) {
          const lyricsPath = path.join(dir, file);
          return fs.readFileSync(lyricsPath, 'utf-8');
        }
      }
    }
  }

  // 2. Try canciones.txt in the same directory
  const globalLyricsPath = path.join(dir, 'canciones.txt');
  if (fs.existsSync(globalLyricsPath) && songTitle) {
    const content = fs.readFileSync(globalLyricsPath, 'utf-8');
    // Split by section headers: "--- Title ---" or "== Title ==" or "[Title]"
    const sections = content.split(/\n(?=---|\[|==)/);
    for (const section of sections) {
      const firstLine = section.split('\n')[0];
      const titleInFile = firstLine
        .replace(/^[-=\[\]]+\s*/g, '')
        .replace(/\s*[-=\[\]]+$/g, '')
        .trim()
        .toLowerCase();
      const targetTitle = songTitle.toLowerCase();
      if (titleInFile && (targetTitle.includes(titleInFile) || titleInFile.includes(targetTitle))) {
        // Return the lyrics (everything after the header line)
        return section.split('\n').slice(1).join('\n').trim();
      }
    }
  }

  return null;
}

/**
 * Extracts and saves embedded album art to disk.
 * @param {object} metadata - music-metadata parsed result
 * @param {string} audioPath - Path to the audio file (used to name the image)
 * @returns {string|null} Relative path to saved cover image or null
 */
function saveCoverArt(metadata, audioPath) {
  const pic = metadata.common.picture && metadata.common.picture[0];
  if (!pic) return null;

  const coversDir = path.resolve('./public/assets/covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  const hash = require('crypto').createHash('md5').update(audioPath).digest('hex').slice(0, 20);
  const ext = pic.format.split('/')[1] || 'jpg';
  const filename = `${hash}.${ext}`;
  const fullPath = path.join(coversDir, filename);

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, pic.data);
  }

  return `/assets/covers/${filename}`;
}

/**
 * Inserts or updates a song record in the database.
 * @param {string} filePath - Absolute path to the audio file
 */
async function indexFile(filePath) {
  if (!SUPPORTED_EXTENSIONS.test(filePath)) return;

  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const { title, artist, album } = metadata.common;
    const duration = metadata.format.duration || 0;
    const coverPath = saveCoverArt(metadata, filePath);

    db.run(
      `INSERT OR REPLACE INTO songs (path, title, artist, album, duration, cover_path)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        filePath,
        title || path.basename(filePath, path.extname(filePath)),
        artist || 'Unknown Artist',
        album || 'Unknown Album',
        duration,
        coverPath
      ],
      (err) => {
        if (err) console.error('DB insert error for', filePath, err.message);
      }
    );
  } catch (err) {
    console.error('Error parsing metadata for', filePath, err.message);
  }
}

/**
 * Starts the file watcher on the given music directory.
 * @param {string} musicDir - Path to the folder to watch
 */
function startScanner(musicDir) {
  const resolvedDir = path.resolve(musicDir);

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
    console.log('Created music directory:', resolvedDir);
  }

  console.log('Starting file watcher on:', resolvedDir);

  const watcher = chokidar.watch(resolvedDir, {
    ignored: /(^|[\/\\])\.\./,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('add', (filePath) => {
    console.log('New file detected:', filePath);
    indexFile(filePath);
  });

  watcher.on('change', (filePath) => {
    console.log('File changed:', filePath);
    indexFile(filePath);
  });

  watcher.on('unlink', (filePath) => {
    console.log('File removed:', filePath);
    db.run('DELETE FROM songs WHERE path = ?', [filePath], (err) => {
      if (err) console.error('DB delete error:', err.message);
    });
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  return watcher;
}

module.exports = { startScanner, indexFile, findLyrics };
