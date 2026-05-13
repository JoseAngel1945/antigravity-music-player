# Especificacion de Diseno: Reproductor de Musica Local "Black Harmony"

Un reproductor de musica web para uso local que escanea una carpeta de archivos de audio, extrae metadatos y ofrece una experiencia de usuario premium similar a Spotify, incluyendo gestion de playlists y visualizacion de letras.

## 1. Vision General
*   **Proposito:** Gestionar y reproducir colecciones de musica locales de forma sencilla y elegante.
*   **Tecnologia:** Vainilla (HTML/CSS/JS), Node.js (Express), SQLite, Chokidar (Live Sync), music-metadata.
*   **Estilo Visual:** Panel oscuro moderno (Dark Mode) con una interfaz de tres paneles (Sidebar, Contenido, Reproductor).

## 2. Requerimientos Funcionales
*   **Escaneo de Carpeta:** El servidor debe vigilar una carpeta configurada y actualizar la base de datos automaticamente al anadir/borrar archivos.
*   **Extraccion de Metadatos:** Extraer titulo, artista, album y caratula de archivos MP3/FLAC/WAV.
*   **Busqueda Global:** Filtrado instantaneo de la biblioteca por cualquier campo de texto.
*   **Gestion de Playlists:** Crear listas, anadir canciones y borrarlas.
*   **Reproduccion:** Controles estandar (Play, Pause, Next, Prev, Progress, Volume).
*   **Panel de Letras:** Pantalla deslizable que muestra la letra de la cancion (buscando archivos `.lrc` o `.txt` con el mismo nombre que el audio).

## 3. Arquitectura Tecnica

### Backend (Node.js)
*   **File Watcher:** `chokidar` para monitoreo de archivos.
*   **Metadata Parser:** `music-metadata` para leer tags ID3.
*   **Database:** `sqlite3` para persistencia.
*   **API REST:**
    *   `GET /api/songs`: Lista completa de canciones.
    *   `GET /api/songs/search?q=...`: Resultados de busqueda.
    *   `POST /api/playlists`: Crear playlist.
    *   `GET /api/playlists/:id`: Canciones de una lista.
    *   `GET /api/stream/:id`: Streaming del archivo de audio.
    *   `GET /api/lyrics/:id`: Obtener contenido del archivo de letra.

### Frontend (Vanilla JS)
*   **Estructura:** Single Page Application (SPA) para evitar cortes de audio.
*   **Componentes:**
    *   `Sidebar`: Navegacion y listas de reproduccion.
    *   `SearchHeader`: Entrada de busqueda global.
    *   `MainContent`: Vista de tabla de canciones o vista de lista de reproduccion.
    *   `PlayerBar`: Controles de audio y visualizacion de progreso.
    *   `LyricsPanel`: Modal deslizable (overlay).

## 4. Esquema de Base de Datos (SQLite)
*   **`songs`**: `id`, `path`, `title`, `artist`, `album`, `duration`, `cover_path`.
*   **`playlists`**: `id`, `name`, `created_at`.
*   **`playlist_songs`**: `playlist_id`, `song_id`.

## 5. Interfaz de Usuario (UI)
*   **Colores:** Fondo `#121212`, Acentos `#1DB954` (verde) o `#ffffff`.
*   **Tipografia:** Inter o sistema sans-serif.
*   **Interacciones:**
    *   Doble clic en cancion para reproducir.
    *   Clic en info de cancion para abrir letras.
    *   Barra de busqueda con debounce para rendimiento.

## 6. Proximos Pasos
1. Configurar estructura de carpetas de Node.js.
2. Implementar el escaner de archivos y la base de datos.
3. Desarrollar la API de streaming y metadatos.
4. Construir el frontend vainilla con el reproductor base.
5. Anadir funcionalidades extra (Playlists, Busqueda, Letras).
