const { spawn } = require('child_process');

// quality: libvorbis -q:a scale, 0 (worst) - 10 (best). 6 is a solid
// default balance of size vs quality.
function compressToOgg(inputPath, outputPath, quality = 6) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-c:a', 'libvorbis',
      '-q:a', String(quality),
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

module.exports = { compressToOgg };
