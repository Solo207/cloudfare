const { spawn } = require('child_process');

// Opus (not Vorbis) in an Ogg container, mono, low constant bitrate —
// matches a known-working reference config tuned for spoken/voice
// content. 16kbps is intentionally aggressive; this isn't music quality,
// it's optimized for small file size over WhatsApp.
function compressToOpus(inputPath, outputPath, bitrateKbps = 16) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-c:a', 'libopus',
      '-ac', '1',
      '-b:a', `${bitrateKbps}k`,
      outputPath,
    ];

    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
      resolve(outputPath);
    });
  });
}

module.exports = { compressToOpus };
