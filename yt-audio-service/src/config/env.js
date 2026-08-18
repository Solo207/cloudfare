require('dotenv').config();

const required = ['API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiKey: process.env.API_KEY,
  proxyUrl: process.env.YTDLP_PROXY_URL || null,
  cookiesPath: process.env.YTDLP_COOKIES_PATH || null,
  tempDir: process.env.TEMP_DIR || '/app/temp',
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
  maxUploadMB: parseInt(process.env.MAX_UPLOAD_MB || '250', 10),
  minFreeDiskMB: parseInt(process.env.MIN_FREE_DISK_MB || '2048', 10),
  ttlSweepIntervalMs: parseInt(process.env.TTL_SWEEP_INTERVAL_MS || '900000', 10),
  ttlMaxAgeMs: parseInt(process.env.TTL_MAX_AGE_MS || '1800000', 10),
};
