const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

// Unique per-job dir — required now that requests are handled
// concurrently with no queue; prevents jobs from colliding on filenames.
function createJobDir() {
  const jobId = uuidv4();
  const dir = path.join(config.tempDir, jobId);
  fs.mkdirSync(dir, { recursive: true });
  return { jobId, dir };
}

// Fires on both success and error paths (see routes). The TTL sweep
// (jobs/ttlSweep.js) is the backstop for anything that skips this.
function cleanupDir(dir) {
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) console.error(`Cleanup failed for ${dir}:`, err.message);
  });
}

module.exports = { createJobDir, cleanupDir };
