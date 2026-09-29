const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errorResponse } = require('../utils/response');

/**
 * Standard API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many requests. Please slow down and try again later.'
    });
  }
});

/**
 * Stricter Rate Limiter for Authentication routes to prevent brute-force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
