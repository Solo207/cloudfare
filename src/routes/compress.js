const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const apiKeyAuth = require('../middleware/auth');
const { createJobDir, cleanupDir } = require('../lib/tempStorage');
const { getFreeDiskMB } = require('../lib/diskCheck');
const { compressToOpus } = require('../services/ffmpeg');
const config = require('../config/env');

const router = express.Router();

// diskStorage — the upload streams straight to disk, never buffers the
// full file in memory (memoryStorage would defeat the point at 250MB).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMB * 1024 * 1024 },
});

router.post('/compress', apiKeyAuth, upload.single('audio'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing "audio" file in upload' });
  }

  const uploadedPath = req.file.path;
  // Defaults to 16kbps mono — deliberately aggressive, tuned for
  // spoken-word content delivered over WhatsApp, not music quality.
  const bitrateKbps = req.body.bitrateKbps ? parseInt(req.body.bitrateKbps, 10) : 16;
  let jobDir;

  try {
    const freeMB = await getFreeDiskMB(config.tempDir);
    if (freeMB < config.minFreeDiskMB) {
      fs.unlink(uploadedPath, () => {});
      return res.status(503).json({ error: 'Server temporarily low on storage, try again shortly' });
    }

    const job = createJobDir();
    jobDir = job.dir;

    const outputPath = path.join(jobDir, 'output.opus');
    await compressToOpus(uploadedPath, outputPath, bitrateKbps);

    const stream = fs.createReadStream(outputPath);
    res.setHeader('Content-Type', 'audio/opus');
    res.setHeader('Content-Disposition', 'attachment; filename="compressed.opus"');

    const cleanup = () => {
      cleanupDir(jobDir);
      fs.unlink(uploadedPath, () => {});
    };
    res.on('close', cleanup);
    stream.on('error', (err) => {
      cleanup();
      next(err);
    });

    stream.pipe(res);
  } catch (err) {
    if (jobDir) cleanupDir(jobDir);
    fs.unlink(uploadedPath, () => {});
    next(err);
  }
});

// Catches multer errors (e.g. file too large) before the generic handler.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;

