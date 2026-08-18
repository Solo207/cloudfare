const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');

function runYtDlp(url, outputDir, format, useProxy) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, '%(id)s.%(ext)s');
    const args = [
      '-x',
      '--audio-format', format,
      '-o', outputTemplate,
      '--no-playlist',
      // -v surfaces the [jsc]/remote-component debug lines — kept on
      // since we still want visibility if the proxy fallback path fails.
      '-v',
      '--js-runtimes', 'node',
      '--remote-components', 'ejs:github',
      '--legacy-server-connect',
    ];

    if (useProxy && config.proxyUrl) {
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
        // Tail only (not full output) — -v echoes the full command line,
        // including the proxy credentials, at the very start of stderr;
        // keeping just the tail captures the actual failure without
        // leaking that into every error response.
        return reject(new Error(`yt-dlp exited with code ${code}: ${stderr.slice(-1500)}`));
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

// Tries a direct connection first (faster, no proxy-exit-node TLS
// issues). Falls back to the configured proxy only if that fails —
// keeps the proxy as insurance against future IP-based blocking
// without paying its reliability cost on every request.
async function downloadAudio(url, outputDir, format = 'mp3') {
  try {
    return await runYtDlp(url, outputDir, format, false);
  } catch (directErr) {
    if (!config.proxyUrl) {
      throw directErr;
    }
    try {
      return await runYtDlp(url, outputDir, format, true);
    } catch (proxyErr) {
      throw new Error(
        `Direct attempt failed: ${directErr.message}\nProxy attempt also failed: ${proxyErr.message}`,
      );
    }
  }
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
