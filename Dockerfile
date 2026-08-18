FROM node:22-slim

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

# No separate JS-challenge-solver plugin needed: this image has a real
# Node.js runtime (node:22-slim — yt-dlp requires >=22 as of its June
# 2026 release; Node 20 is rejected as unsupported), and
# src/services/ytdlp.js points yt-dlp at it directly via --js-runtimes.
#
# Prefetch and cache the EJS challenge-solver script (from
# github.com/yt-dlp/ejs) here at BUILD time, using the build environment's
# direct network — not the runtime proxy, which may not reliably reach
# GitHub from every exit node. This bakes the script into the image so
# requests don't depend on fetching it live through the proxy. The
# --remote-components flag stays in ytdlp.js too, so a runtime refetch is
# still attempted if this cache ever goes stale.
RUN yt-dlp --js-runtimes node --remote-components ejs:github \
    --simulate --no-warnings "https://www.youtube.com/watch?v=jNQXAC9IVRw" \
    || echo "EJS prefetch failed at build time — will rely on runtime fetch"

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

# EXPOSE is documentation only — it does not control routing. The app
# actually binds to whatever PORT Easypanel injects at runtime (see
# src/config/env.js), which may differ from this value.
EXPOSE 3000

CMD ["node", "src/server.js"]
