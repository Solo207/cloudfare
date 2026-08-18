const config = require('../config/env');

// Simple string comparison (not timing-safe) — accepted tradeoff for this
// service's threat model. Applies to every route that needs protecting.
function apiKeyAuth(req, res, next) {
  const provided = req.headers['x-api-key'];
  if (!provided || provided !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = apiKeyAuth;
