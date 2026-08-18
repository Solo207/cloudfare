const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');

function downloadAudio(url, outputDir, format = 'mp3') {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, '%(id)s.%(ext)s');
    const args = [
      '-x',
      '--audio-format', format,
      '-o', outputTemplate,
      '--no-playlist',
      // -v surfaces the [jsc]/remote-component debug lines that explain
      // exactly what's happening with the challenge solver — without
      // this, the real cause was getting hidden.
      '-v',
      // Solves YouTube's "n challenge" JS bot-check: --js-runtimes gives
      // yt-dlp a place to run the solver (the Node.js already in this
      // image), --remote-components ejs:github lets it fetch the actual
      // solver script from github.com/yt-dlp/ejs (cached after first run).
      // Requires outbound network access to GitHub from this container.
      '--js-runtimes', 'node',
      '--remote-components', 'ejs:github',
      // yt-dlp's own suggested fix for SSLV3_ALERT_HANDSHAKE_FAILURE —
      // seen when the connection path (often a proxy exit node) doesn't
      // support RFC 5746 secure renegotiation.
      '--legacy-server-connect',
    ];

    if (config.proxyUrl) {
      args.push('--proxy', config.proxyUrl);
    }
    if (config.cookiesPath) {
      args.push('--cookies', config.cookiesPath);
    }

    args.push(url);

    const proc = spawn('yt-dlp', args);

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        // Full output for now (was silently truncated to 500 chars,
        // which was cutting off the actual diagnostic lines) — trim
        // this back down once the real cause is confirmed.
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
      const files = fs.readdirSync(outputDir);
      const produced = files.find((f) => f.endsWith(`.${format}`));
      if (!produced) {
        return reject(new Error('yt-dlp finished but no output file was found'));
      }
      resolve(path.join(outputDir, produced));
    });
  });
}

// Backs the protected /admin/update-ytdlp endpoint.
function updateYtdlp() {
  return new Promise((resolve, reject) => {
    const proc = spawn('pip3', ['install', '-U', '--break-system-packages', 'yt-dlp']);

    let output = '';
    proc.stdout.on('data', (c) => { output += c.toString(); });
    proc.stderr.on('data', (c) => { output += c.toString(); });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Update failed: ${output.slice(-500)}`));
      resolve(output.slice(-1000));
    });
  });
}

module.exports = { downloadAudio, updateYtdlp };
