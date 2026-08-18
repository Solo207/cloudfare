# yt-audio-service

YouTube audio download + audio compression microservice for ATLAS.
Node.js/Express, yt-dlp + ffmpeg baked into the Docker image, deployed on
Easypanel.

## Endpoints

All routes require an `x-api-key` header matching `API_KEY`.

### `POST /download`
Body (JSON): `{ "url": "<youtube-url>", "format": "mp3" }` (`format` optional, defaults to `mp3`)
Response: streamed audio file.

### `POST /compress`
Multipart form: `audio` (file, up to `MAX_UPLOAD_MB`), `bitrateKbps` (optional, default 16)
Response: streamed `.opus` file (mono, libopus).

### `POST /admin/update-ytdlp`
Runs `pip3 install -U yt-dlp` on the running container. No body required.

### `GET /health`
Unauthenticated liveness check.

## Environment variables

See `.env.example` for the full list and defaults.

## Easypanel deployment notes

- **Volumes**: mount `TEMP_DIR` and `UPLOAD_DIR` as persistent volumes so
  temp files survive redeploys and don't collide across replicas.
- **Cookies**: store `cookies.txt` on a mounted volume (or write it from a
  base64 env var on startup) — never commit it to the repo. Use a
  throwaway Google account, not a primary one.
- **API key**: set `API_KEY` as an Easypanel environment variable.
- **Proxy timeout**: raise Easypanel's proxy timeout to match
  `server.timeout` in `src/server.js` (currently 20 minutes), so long
  downloads/uploads aren't cut off at the edge before your app responds.
- **Body size**: Easypanel/Traefik's own request body size limit needs
  raising to match `MAX_UPLOAD_MB`, in addition to multer's limit —
  otherwise large uploads get rejected before reaching the app.

## Local development

```bash
cp .env.example .env
npm install
npm start
```

Requires `yt-dlp` and `ffmpeg` on PATH locally (the Dockerfile installs
both automatically for production).
