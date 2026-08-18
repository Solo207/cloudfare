const express = require('express');
const apiKeyAuth = require('../middleware/auth');
const { updateYtdlp } = require('../services/ytdlp');

const router = express.Router();

router.post('/admin/update-ytdlp', apiKeyAuth, async (req, res, next) => {
  try {
    const output = await updateYtdlp();
    res.json({ status: 'ok', output });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
