const env = require('../config/env');
const { errorResponse } = require('../utils/response');

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  return errorResponse(res, {
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found.`
  });
}

/**
 * Global Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An internal server error occurred.';

  // Log server-side for developer debugging
  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err);
  }

  return errorResponse(res, {
    statusCode,
    message,
    // Include stack trace only in explicit local non-production if needed
    error: env.isProduction ? undefined : (err.error || err.message)
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
