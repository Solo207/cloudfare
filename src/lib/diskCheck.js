const { execFile } = require('child_process');

// Guards against pile-up from unbounded concurrency: reject new jobs
// early with a clean 503 instead of starting work that will fail
// mid-download when disk fills up.
function getFreeDiskMB(targetPath) {
  return new Promise((resolve, reject) => {
    execFile('df', ['-Pk', targetPath], (err, stdout) => {
      if (err) return reject(err);
      const lines = stdout.trim().split('\n');
      const parts = lines[lines.length - 1].split(/\s+/);
      const availableKB = parseInt(parts[3], 10);
      if (Number.isNaN(availableKB)) {
        return reject(new Error(`Could not parse df output for ${targetPath}`));
      }
      resolve(availableKB / 1024);
    });
  });
}

module.exports = { getFreeDiskMB };
