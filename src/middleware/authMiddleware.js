const { extractToken, verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');

/**
 * Authentication Middleware: verifies Bearer token or cookie,
 * and sets req.user = { id, email, name }.
 * Enforces user isolation so client cannot spoof userId.
 */
function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required. No access token provided.'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid authentication credentials.'
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    return errorResponse(res, {
      statusCode: error.statusCode || 401,
      message: error.message || 'Authentication failed.'
    });
  }
}

module.exports = {
  authenticate
};
