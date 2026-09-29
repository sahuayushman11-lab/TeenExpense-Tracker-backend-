/**
 * Standardized API response helper functions
 */

function successResponse(res, { statusCode = 200, message = 'Success', data = null, meta = undefined }) {
  const payload = {
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {})
  };
  return res.status(statusCode).json(payload);
}

function errorResponse(res, { statusCode = 500, message = 'An error occurred', error = null, errors = null }) {
  const payload = {
    success: false,
    message,
    ...(error !== null && error !== undefined ? { error: typeof error === 'object' && error.message ? error.message : error } : {}),
    ...(errors !== null && errors !== undefined ? { errors } : {})
  };
  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
