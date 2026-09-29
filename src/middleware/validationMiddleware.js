const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to check validation results from express-validator rules.
 * If validation fails, responds with 400 and formatted error list.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation failed. Please verify input data.',
      errors: formattedErrors
    });
  }
  next();
}

module.exports = {
  validate
};
