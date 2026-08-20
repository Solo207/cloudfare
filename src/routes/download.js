const express = require('express');
const fs = require('fs');
const path = require('path');
const apiKeyAuth = require('../middleware/auth');
const { createJobDir, cleanupDir } = require('../lib/tempStorage');
const { getFreeDiskMB } = require('../lib/diskCheck');
const { downloadAudio } = require('../services/ytdlp');
const config = require('../config/env');

const router = express.Router();

router.post('/download', apiKeyAuth, async (req, res, next) => {
  const { url, format, forceProxy } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" in request body' });
  }

  let jobDir;
  try {
    const freeMB = await getFreeDiskMB(config.tempDir);
    if (freeMB < config.minFreeDiskMB) {
      return res.status(503).json({ error: 'Server temporarily low on storage, try again shortly' });
    }

    const job = createJobDir();
    jobDir = job.dir;

    const filePath = await downloadAudio(url, jobDir, format || 'mp3', Boolean(forceProxy), job.jobId);

    const stream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

    const cleanup = () => cleanupDir(jobDir);
    res.on('close', cleanup);
    stream.on('error', (err) => {
      cleanup();
      next(err);
    });

    stream.pipe(res);
  } catch (err) {
    if (jobDir) cleanupDir(jobDir);
    next(err);
  }
});

module.exports = router;
