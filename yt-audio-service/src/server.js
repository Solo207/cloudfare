const app = require('./app');
const config = require('./config/env');
const { startTtlSweep } = require('./jobs/ttlSweep');

const server = app.listen(config.port, () => {
  console.log(`yt-audio-service listening on port ${config.port}`);
});

// Raised to accommodate long downloads and large uploads.
// Easypanel's own proxy timeout must be raised to match — see README.
server.timeout = 20 * 60 * 1000; // 20 minutes
server.keepAliveTimeout = 20 * 60 * 1000;
server.headersTimeout = 20 * 60 * 1000 + 5000;

startTtlSweep();
