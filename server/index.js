require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { startScanner, findLyrics } = require('./scanner');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── SONGS ────────────────────────────────────────────────────────────────────

/** GET /api/songs - List all songs */
app.get('/api/songs', (req, res) => {
  db.all('SELECT * FROM songs ORDER BY artist, album, title', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/** GET /api/songs/search?q=term - Search songs */
app.get('/api/songs/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  db.all(
    `SELECT * FROM songs
     WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
     ORDER BY artist, album, title`,
    [q, q, q],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/** GET /api/songs/album/:album - Get songs by exact album */
app.get('/api/songs/album/:album', (req, res) => {
  db.all(
    `SELECT * FROM songs
     WHERE album = ?
     ORDER BY artist, album, title`,
    [req.params.album],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/** GET /api/stream/:id - Stream an audio file */
app.get('/api/stream/:id', (req, res) => {
  db.get('SELECT path FROM songs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Song not found' });

    const filePath = path.resolve(row.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.sendFile(filePath);
  });
});

/** GET /api/lyrics/:id - Get lyrics for a song */
app.get('/api/lyrics/:id', (req, res) => {
  db.get('SELECT path, title FROM songs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Song not found' });

    const lyrics = findLyrics(row.path, row.title);
    if (!lyrics) return res.status(404).json({ error: 'No lyrics file found' });

    res.json({ lyrics });
  });
});

// ─── PLAYLISTS ─────────────────────────────────────────────────────────────────

/** GET /api/playlists - List all playlists */
app.get('/api/playlists', (req, res) => {
  db.all('SELECT * FROM playlists ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/** POST /api/playlists - Create a new playlist */
app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  db.run('INSERT INTO playlists (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name });
  });
});

/** DELETE /api/playlists/:id - Delete a playlist */
app.delete('/api/playlists/:id', (req, res) => {
  db.run('DELETE FROM playlists WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  });
});

/** GET /api/playlists/:id/songs - Get songs in a playlist */
app.get('/api/playlists/:id/songs', (req, res) => {
  db.all(
    `SELECT s.* FROM songs s
     JOIN playlist_songs ps ON ps.song_id = s.id
     WHERE ps.playlist_id = ?
     ORDER BY s.artist, s.title`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/** POST /api/playlists/:id/songs - Add a song to a playlist */
app.post('/api/playlists/:id/songs', (req, res) => {
  const { songId } = req.body;
  if (!songId) return res.status(400).json({ error: 'songId is required' });

  db.run(
    'INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
    [req.params.id, songId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Song added to playlist' });
    }
  );
});

/** DELETE /api/playlists/:id/songs/:songId - Remove song from playlist */
app.delete('/api/playlists/:id/songs/:songId', (req, res) => {
  db.run(
    'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
    [req.params.id, req.params.songId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Entry not found' });
      res.json({ message: 'Song removed from playlist' });
    }
  );
});

// ─── SERVER ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const MUSIC_DIR = process.env.MUSIC_DIR || './music';

app.listen(PORT, () => {
  console.log(`🎵 Black Harmony running at http://localhost:${PORT}`);
  startScanner(MUSIC_DIR);
});
