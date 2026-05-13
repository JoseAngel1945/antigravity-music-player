# 🎵 Black Harmony (Antigravity Music Player)

Black Harmony es un reproductor de musica **local-first** con una interfaz moderna en modo oscuro inspirada en Spotify. Diseñado para ofrecer una experiencia fluida de escaneo, organizacion y reproduccion de tu biblioteca de audio local.

## ✨ Caracteristicas Principales

- **Escaneo Automatico y en Tiempo Real**: Monitorea continuamente la carpeta `music/` utilizando `chokidar` para detectar nuevas canciones, modificaciones o eliminaciones al instante.
- **Extraccion de Metadatos y Caratulas**: Utiliza `music-metadata` para leer etiquetas ID3 (titulo, artista, album, duracion) y extrae caratulas incrustadas de forma optimizada mediante hashes MD5.
- **Soporte de Letras Dinamicas**:
  - Archivos `.lrc` o `.txt` individuales con el mismo nombre de la pista.
  - Archivo maestro compartido `canciones.txt` por directorio/album.
- **Gestion de Playlists**: Creacion de listas de reproduccion personalizadas con persistencia relacional y actualizacion instantanea.
- **Busqueda y Ordenamiento**: Busqueda instantanea por pista, artista o album, junto con controles de ordenacion por nombre, album o duracion.
- **Diseno Premium**: Interfaz tipo Single Page Application (SPA) en Vanilla JS y CSS moderno con diseno responsivo, panel deslizante de letras y controles completos de reproduccion.

---

## 🛠️ Stack Tecnologico

- **Backend**: Node.js, Express, SQLite3
- **Vigilancia de Archivos**: Chokidar
- **Analisis de Audio**: Music-metadata
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)

---

## 📁 Estructura del Proyecto

```text
antigravity/
├── server/
│   ├── index.js       # Servidor Express y definicion de endpoints REST
│   ├── db.js          # Configuracion y esquemas de la base de datos SQLite
│   └── scanner.js     # Logica de escaneo de archivos y parseo de letras
├── public/
│   ├── index.html     # Estructura principal de la SPA
│   ├── style.css      # Estilos premium, animaciones y diseno oscuro
│   └── app.js         # Logica del cliente, reproductor de audio y estado
├── music/             # Directorio raiz para colocar tus archivos de audio locales
├── data/
│   └── music.db       # Base de datos SQLite generada automaticamente
├── .env               # Variables de entorno configurables
└── package.json       # Dependencias y scripts de inicio
```

---

## 🚀 Instalacion y Uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/JoseAngel1945/antigravity-music-player.git
cd antigravity-music-player
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Añadir Musica
Coloca tus archivos de audio compatibles (`.mp3`, `.flac`, `.wav`, `.m4a`, `.ogg`, `.opus`) dentro de la carpeta `music/`.

### 4. Iniciar la aplicacion
```bash
npm start
```
El servidor se iniciara en `http://localhost:3000` y comenzara a sincronizar tu biblioteca automaticamente.
