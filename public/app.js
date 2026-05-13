/* ─── STATE ──────────────────────────────────────────────────────────────────── */
const state = {
  songs: [],
  currentSong: null,
  currentIndex: -1,
  queue: [],
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0,
  playlists: [],
  currentPlaylistId: null,
  lyricsOpen: false,
  searchDebounce: null,
};

/* ─── DOM REFS ───────────────────────────────────────────────────────────────── */
const audio = document.getElementById('audio-element');
const songList = document.getElementById('song-list');
const emptyState = document.getElementById('empty-state');
const songTable = document.getElementById('song-table');
const viewTitle = document.getElementById('view-title');
const playlistList = document.getElementById('playlist-list');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

const playerCover = document.getElementById('player-cover');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const btnPlay = document.getElementById('btn-play');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const btnHeart = document.getElementById('btn-heart');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const volumeSlider = document.getElementById('volume-slider');

const lyricsPanel = document.getElementById('lyrics-panel');
const lyricsTitle = document.getElementById('lyrics-title');
const lyricsArtist = document.getElementById('lyrics-artist');
const lyricsCover = document.getElementById('lyrics-cover');
const lyricsText = document.getElementById('lyrics-text');
const btnCloseLyrics = document.getElementById('btn-close-lyrics');
const btnLyricsToggle = document.getElementById('btn-lyrics-toggle');

const modalOverlay = document.getElementById('modal-overlay');
const modalPlaylistList = document.getElementById('modal-playlist-list');
const btnModalClose = document.getElementById('btn-modal-close');

const contextMenu = document.getElementById('context-menu');
const ctxPlay = document.getElementById('ctx-play');
const ctxAddPlaylist = document.getElementById('ctx-add-playlist');

/* ─── UTILITIES ──────────────────────────────────────────────────────────────── */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function api(endpoint, options = {}) {
  const res = await fetch(endpoint, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/* ─── SONG RENDERING ─────────────────────────────────────────────────────────── */
function renderSongs(songs) {
  songList.innerHTML = '';

  if (!songs.length) {
    songTable.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  songTable.classList.remove('hidden');
  emptyState.classList.add('hidden');

  songs.forEach((song, index) => {
    const tr = document.createElement('tr');
    tr.className = 'song-row';
    tr.dataset.id = song.id;
    tr.dataset.index = index;

    const isPlaying = state.currentSong && state.currentSong.id === song.id;
    if (isPlaying) tr.classList.add('playing');

    tr.innerHTML = `
      <td class="col-num-cell">
        <span class="row-num">${isPlaying ? '' : index + 1}</span>
        <span class="play-on-hover">▶</span>
        <span class="playing-icon">${isPlaying ? '♫' : ''}</span>
      </td>
      <td class="col-title-cell">
        <div class="song-meta">
          ${song.cover_path
            ? `<img src="${song.cover_path}" alt="cover" class="song-cover" loading="lazy" />`
            : `<div class="song-cover-placeholder">♪</div>`}
          <div class="song-info-wrapper">
            <div class="song-name">${escapeHTML(song.title || 'Sin titulo')}</div>
            <div class="song-artist">${escapeHTML(song.artist || 'Artista desconocido')}</div>
          </div>
        </div>
      </td>
      <td class="col-album-cell clickable-album" data-album="${escapeHTML(song.album || '')}" style="cursor: pointer;">${escapeHTML(song.album || '')}</td>
      <td class="col-duration-cell">${formatTime(song.duration)}</td>
      <td class="col-actions-cell">
        <button class="btn-three-dots" title="Opciones" aria-label="Opciones">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>
      </td>
    `;

    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-three-dots')) return;

      const albumCell = e.target.closest('.clickable-album');
      if (albumCell) {
        e.stopPropagation();
        const albumName = albumCell.dataset.album;
        if (albumName) {
          api(`/api/songs/album/${encodeURIComponent(albumName)}`)
            .then(results => {
              renderSongs(results);
              viewTitle.textContent = `Album: ${albumName}`;
              searchInput.value = '';
            })
            .catch(err => console.error('Error fetching album:', err));
        }
        return;
      }

      playSong(song, songs, index);
    });

    tr.querySelector('.btn-three-dots').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.playlists.length) {
        alert('Primero crea una playlist desde la barra lateral.');
        return;
      }
      openAddToPlaylistModal(song);
    });

    tr.addEventListener('contextmenu', (e) => showContextMenu(e, song));

    songList.appendChild(tr);
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightCurrentRow() {
  document.querySelectorAll('.song-row').forEach(row => {
    const isPlaying = state.currentSong && parseInt(row.dataset.id) === state.currentSong.id;
    row.classList.toggle('playing', isPlaying);
    const numEl = row.querySelector('.row-num');
    const playIcon = row.querySelector('.playing-icon');
    if (numEl) numEl.textContent = isPlaying ? '' : parseInt(row.dataset.index) + 1;
    if (playIcon) playIcon.textContent = isPlaying ? '♫' : '';
  });
}

/* ─── PLAYBACK ───────────────────────────────────────────────────────────────── */
function playSong(song, queue = state.songs, index = 0) {
  state.currentSong = song;
  state.queue = queue;
  state.currentIndex = index;

  audio.src = `/api/stream/${song.id}`;
  audio.play().then(() => {
    state.isPlaying = true;
    updatePlayButton();
    updatePlayerBar();
    highlightCurrentRow();
    if (state.lyricsOpen) loadLyrics(song);
  }).catch(err => console.error('Playback error:', err));
}

function updatePlayerBar() {
  const song = state.currentSong;
  if (!song) return;

  playerTitle.textContent = song.title || 'Sin titulo';
  playerArtist.textContent = song.artist || '';

  if (song.cover_path) {
    playerCover.style.backgroundImage = `url("${song.cover_path}")`;
  } else {
    playerCover.style.backgroundImage = '';
    playerCover.textContent = '♪';
  }
}

function updatePlayButton() {
  if (state.isPlaying) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }
}

function togglePlay() {
  if (!state.currentSong) {
    if (state.songs.length) playSong(state.songs[0], state.songs, 0);
    return;
  }
  if (state.isPlaying) {
    audio.pause();
    state.isPlaying = false;
  } else {
    audio.play();
    state.isPlaying = true;
  }
  updatePlayButton();
}

function playNext() {
  if (!state.queue.length) return;
  let nextIndex;

  if (state.isShuffle) {
    if (state.queue.length === 1) {
      nextIndex = 0;
    } else {
      do {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      } while (nextIndex === state.currentIndex);
    }
  } else {
    nextIndex = (state.currentIndex + 1) % state.queue.length;
  }

  playSong(state.queue[nextIndex], state.queue, nextIndex);
}

function playPrev() {
  if (!state.queue.length) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  let prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  playSong(state.queue[prevIndex], state.queue, prevIndex);
}

/* ─── SEARCH ─────────────────────────────────────────────────────────────────── */
searchInput.addEventListener('input', () => {
  clearTimeout(state.searchDebounce);
  state.searchDebounce = setTimeout(async () => {
    const q = searchInput.value.trim();
    if (!q) {
      renderSongs(state.songs);
      viewTitle.textContent = 'Tu Musica';
      return;
    }
    try {
      const results = await api(`/api/songs/search?q=${encodeURIComponent(q)}`);
      renderSongs(results);
      viewTitle.textContent = `Resultados para "${q}"`;
    } catch (err) {
      console.error('Search error:', err);
    }
  }, 250);
});

/* ─── SORTING ────────────────────────────────────────────────────────────────── */
sortSelect.addEventListener('change', () => {
  const sortBy = sortSelect.value;
  state.songs.sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'album') {
      const cmp = (a.album || '').localeCompare(b.album || '');
      if (cmp !== 0) return cmp;
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'duration') {
      return (a.duration || 0) - (b.duration || 0);
    }
    return 0;
  });
  renderSongs(state.songs);
});

/* ─── PLAYLISTS ──────────────────────────────────────────────────────────────── */
async function loadPlaylists() {
  try {
    state.playlists = await api('/api/playlists');
    renderPlaylists();
  } catch (err) {
    console.error('Error loading playlists:', err);
  }
}

function renderPlaylists() {
  playlistList.innerHTML = '';
  state.playlists.forEach(pl => {
    const li = document.createElement('li');
    li.textContent = pl.name;
    li.dataset.id = pl.id;
    if (state.currentPlaylistId === pl.id) li.classList.add('active');
    li.addEventListener('click', () => loadPlaylistSongs(pl));
    playlistList.appendChild(li);
  });
}

async function loadPlaylistSongs(pl) {
  state.currentPlaylistId = pl.id;
  try {
    const songs = await api(`/api/playlists/${pl.id}/songs`);
    state.songs = songs;
    renderSongs(songs);
    viewTitle.textContent = pl.name;
    renderPlaylists();
  } catch (err) {
    console.error('Error loading playlist songs:', err);
  }
}

document.getElementById('btn-new-playlist').addEventListener('click', async () => {
  const name = prompt('Nombre para la nueva playlist:');
  if (!name || !name.trim()) return;
  try {
    await api('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    });
    await loadPlaylists();
  } catch (err) {
    console.error('Error creating playlist:', err);
  }
});

/* ─── LYRICS ─────────────────────────────────────────────────────────────────── */
async function loadLyrics(song) {
  lyricsTitle.textContent = song.title || 'Sin titulo';
  lyricsArtist.textContent = song.artist || '';

  if (song.cover_path) {
    lyricsCover.style.backgroundImage = `url("${song.cover_path}")`;
  } else {
    lyricsCover.style.backgroundImage = '';
  }

  lyricsText.textContent = 'Buscando letras...';

  try {
    const data = await api(`/api/lyrics/${song.id}`);
    const lines = data.lyrics.split('\n').filter(l => l.trim());
    lyricsText.innerHTML = lines.map(line => {
      const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      return text ? `<span class="lrc-line">${escapeHTML(text)}</span>` : '';
    }).join('');
  } catch {
    lyricsText.innerHTML = `No se encontraron letras.<br/><small>Anade un archivo <code>.lrc</code> o <code>.txt</code> con el mismo nombre que el audio.</small>`;
  }
}

function openLyrics() {
  state.lyricsOpen = true;
  lyricsPanel.classList.remove('hidden');
  btnLyricsToggle.classList.add('active');
  if (state.currentSong) loadLyrics(state.currentSong);
}

function closeLyrics() {
  state.lyricsOpen = false;
  lyricsPanel.classList.add('hidden');
  btnLyricsToggle.classList.remove('active');
}

btnCloseLyrics.addEventListener('click', closeLyrics);
btnLyricsToggle.addEventListener('click', () => {
  if (state.lyricsOpen) closeLyrics();
  else openLyrics();
});

document.getElementById('player-info').addEventListener('click', () => {
  if (state.currentSong) {
    if (state.lyricsOpen) closeLyrics();
    else openLyrics();
  }
});
playerCover.addEventListener('click', () => {
  if (state.currentSong) {
    if (state.lyricsOpen) closeLyrics();
    else openLyrics();
  }
});

/* ─── CONTEXT MENU ───────────────────────────────────────────────────────────── */
let contextSong = null;

function showContextMenu(e, song) {
  e.preventDefault();
  contextSong = song;
  contextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
  contextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 100)}px`;
  contextMenu.classList.remove('hidden');
}

document.addEventListener('click', () => contextMenu.classList.add('hidden'));
document.addEventListener('contextmenu', () => contextMenu.classList.add('hidden'));

ctxPlay.addEventListener('click', () => {
  if (contextSong) {
    const idx = state.songs.findIndex(s => s.id === contextSong.id);
    playSong(contextSong, state.songs, idx >= 0 ? idx : 0);
  }
});

ctxAddPlaylist.addEventListener('click', () => {
  if (!contextSong || !state.playlists.length) return;
  openAddToPlaylistModal(contextSong);
});

/* ─── ADD TO PLAYLIST MODAL ──────────────────────────────────────────────────── */
function openAddToPlaylistModal(song) {
  modalPlaylistList.innerHTML = '';
  state.playlists.forEach(pl => {
    const li = document.createElement('li');
    li.textContent = pl.name;
    li.addEventListener('click', async () => {
      try {
        await api(`/api/playlists/${pl.id}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId: song.id })
        });
        closeModal();
      } catch (err) {
        console.error('Error adding to playlist:', err);
      }
    });
    modalPlaylistList.appendChild(li);
  });
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}
btnModalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

/* ─── AUDIO EVENTS ───────────────────────────────────────────────────────────── */
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  timeCurrent.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  state.isPlaying = false;
  if (state.repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
    state.isPlaying = true;
  } else {
    playNext();
  }
  updatePlayButton();
});

audio.addEventListener('play', () => { state.isPlaying = true; updatePlayButton(); });
audio.addEventListener('pause', () => { state.isPlaying = false; updatePlayButton(); });

let isDragging = false;

progressBar.addEventListener('mousedown', (e) => {
  isDragging = true;
  seekTo(e);
});
document.addEventListener('mousemove', (e) => { if (isDragging) seekTo(e); });
document.addEventListener('mouseup', () => { isDragging = false; });

function seekTo(e) {
  const rect = progressBar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value;
});
audio.volume = volumeSlider.value;

/* ─── CONTROLS ───────────────────────────────────────────────────────────────── */
btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', playNext);
btnPrev.addEventListener('click', playPrev);

btnShuffle.addEventListener('click', () => {
  state.isShuffle = !state.isShuffle;
  btnShuffle.classList.toggle('active', state.isShuffle);
});

btnRepeat.addEventListener('click', () => {
  state.repeatMode = (state.repeatMode + 1) % 3;
  btnRepeat.classList.toggle('active', state.repeatMode > 0);
  btnRepeat.title = ['Repetir: No', 'Repetir: Todo', 'Repetir: Cancion'][state.repeatMode];
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  if (e.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
  if (e.code === 'Escape') closeLyrics();
});

/* ─── NAVIGATION ─────────────────────────────────────────────────────────────── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentPlaylistId = null;
    searchInput.value = '';

    const view = btn.dataset.view;
    if (view === 'home' || view === 'library') {
      viewTitle.textContent = 'Tu Musica';
      renderSongs(state.songs);
      renderPlaylists();
    } else if (view === 'search') {
      viewTitle.textContent = 'Buscar';
      searchInput.focus();
    }
  });
});

/* ─── INIT ───────────────────────────────────────────────────────────────────── */
async function init() {
  try {
    state.songs = await api('/api/songs');
    renderSongs(state.songs);
    state.queue = state.songs;
    await loadPlaylists();

    setInterval(async () => {
      const fresh = await api('/api/songs');
      if (fresh.length !== state.songs.length) {
        state.songs = fresh;
        if (!state.currentPlaylistId && !searchInput.value) {
          renderSongs(state.songs);
          state.queue = state.songs;
        }
      }
    }, 5000);
  } catch (err) {
    console.error('Init error:', err);
  }
}

init();
