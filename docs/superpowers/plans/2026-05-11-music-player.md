# Black Harmony Music Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local music player with live folder scanning, metadata extraction, Spotify-like UI, and a sliding lyrics panel.

**Architecture:** Node.js Express backend with SQLite for metadata storage and chokidar for live file watching. Vanilla JS frontend (SPA) using HTML5 Audio API.

**Tech Stack:** Node.js, Express, SQLite3, music-metadata, Chokidar, Vanilla CSS/JS.

---

### Task 1: Project Initialization & Dependencies

**Files:**
- Create: `package.json`
- Create: `.env`
- Create: `server/index.js`

- [ ] **Step 1: Create package.json and install dependencies**
Run: `npm init -y && npm install express sqlite3 chokidar music-metadata cors dotenv`

- [ ] **Step 2: Create initial .env file**
```env
PORT=3000
MUSIC_DIR=./music
DB_PATH=./data/music.db
```

- [ ] **Step 3: Create directory structure**
Run: `mkdir -p server public/assets data music`

---

### Task 2: Database Schema & Connection

**Files:**
- Create: `server/db.js`

- [ ] **Step 1: Implement SQLite connection and schema**

---

### Task 3: File Scanner & Metadata Extraction

**Files:**
- Create: `server/scanner.js`

---

### Task 4: API Endpoints (Backend)

**Files:**
- Modify: `server/index.js`

---

### Task 5: UI Foundation (HTML/CSS)

**Files:**
- Create: `public/index.html`
- Create: `public/style.css`

---

### Task 6: Frontend Logic (JS)

**Files:**
- Create: `public/app.js`

---

### Task 7: Playlists & Lyrics Feature

**Files:**
- Modify: `server/index.js`
- Modify: `public/app.js`
- Modify: `public/style.css`

---

### Task 8: Verification & Cleanup

- [ ] **Step 1: Verify all features with real MP3 files**
- [ ] **Step 2: Optimize performance of the scanner**
