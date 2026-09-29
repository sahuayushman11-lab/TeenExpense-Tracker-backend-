const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign JWT token for authenticated user
 * @param {object} payload - { id, email, name }
 * @returns {string} Signed JWT token
 */
function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Authentication token has expired. Please log in again.');
      err.statusCode = 401;
      throw err;
    }
    const err = new Error('Invalid authentication token.');
    err.statusCode = 401;
    throw err;
  }
}

/**
 * Extract token from Express Request (Bearer header or cookie)
 * @param {object} req
 * @returns {string|null}
 */
function extractToken(req) {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

module.exports = {
  signToken,
  verifyToken,
  extractToken
};
