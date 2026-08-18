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
      // Solves YouTube's "n challenge" JS bot-check using the Node.js
      // runtime already present in this image (node:20-slim) — no extra
      // plugin or runtime install needed.
      '--js-runtimes', 'node',
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
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr.slice(-500)}`));
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
