// Centralized error responder. Route-level try/catch blocks are
// responsible for their own temp-file cleanup before calling next(err).
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
