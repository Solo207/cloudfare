const fs = require('fs');
const path = require('path');
const config = require('../config/env');

function sweepDir(dirPath) {
  fs.readdir(dirPath, (err, entries) => {
    if (err) return;
    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry);
      fs.stat(fullPath, (statErr, stats) => {
        if (statErr) return;
        const age = Date.now() - stats.mtimeMs;
        if (age > config.ttlMaxAgeMs) {
          fs.rm(fullPath, { recursive: true, force: true }, () => {});
        }
      });
    });
  });
}

// Backstop for anything that skips the normal cleanup-on-completion path
// (crashes, dropped connections, unhandled edge cases).
function startTtlSweep() {
  setInterval(() => {
    sweepDir(config.tempDir);
    sweepDir(config.uploadDir);
  }, config.ttlSweepIntervalMs);
}

module.exports = { startTtlSweep };
