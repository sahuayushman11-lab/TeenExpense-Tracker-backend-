const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('monthly_allowance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Monthly allowance must be a non-negative number'),
  body('currency')
    .optional()
    .isString().isLength({ min: 1, max: 10 }).withMessage('Invalid currency code')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('monthly_allowance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Monthly allowance must be a non-negative number'),
  body('currency')
    .optional()
    .isString().isLength({ min: 1, max: 10 }).withMessage('Invalid currency code'),
  body('theme_preference')
    .optional()
    .isIn(['light', 'dark']).withMessage('Theme preference must be either "light" or "dark"')
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator
};
