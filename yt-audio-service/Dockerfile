FROM node:20-slim

# ffmpeg for audio processing, python3/pip so yt-dlp can be installed and
# later updated via the protected /admin/update-ytdlp endpoint.
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# --break-system-packages needed on Debian's PEP 668-managed Python.
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

# Fallback local dirs — in Easypanel these paths should be mounted as
# persistent volumes (see README) so temp/uploaded files and cookies
# survive redeploys and don't get lost/duplicated across replicas.
RUN mkdir -p /app/temp /app/uploads

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
