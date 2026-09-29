const { body, param } = require('express-validator');

const createBudgetValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Budget name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Budget name must be between 1 and 100 characters'),
  body('amount')
    .notEmpty().withMessage('Budget amount is required')
    .isFloat({ gt: 0 }).withMessage('Budget amount must be a positive number greater than 0'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'custom']).withMessage('Period must be weekly, monthly, or custom'),
  body('start_date')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .optional()
    .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('category_id')
    .optional()
    .trim(),
  body('categoryId')
    .optional()
    .trim()
];

const updateBudgetValidator = [
  param('id').notEmpty().withMessage('Budget ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Budget name must be between 1 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Budget amount must be greater than 0'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'custom']).withMessage('Period must be weekly, monthly, or custom')
];

const budgetIdValidator = [
  param('id').notEmpty().withMessage('Budget ID is required')
];

module.exports = {
  createBudgetValidator,
  updateBudgetValidator,
  budgetIdValidator
};
