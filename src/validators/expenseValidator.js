const { body, param, query } = require('express-validator');

const createExpenseValidator = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number greater than 0'),
  body('category_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Category cannot be empty'),
  body('categoryId') // Support camelCase too
    .optional()
    .trim(),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 1, max: 255 }).withMessage('Description must be between 1 and 255 characters'),
  body('expense_date')
    .optional()
    .isISO8601().withMessage('Expense date must be a valid date (YYYY-MM-DD)'),
  body('expenseDate') // Support camelCase too
    .optional()
    .isISO8601().withMessage('Expense date must be a valid date (YYYY-MM-DD)'),
  body('payment_method')
    .optional()
    .trim()
    .isIn(['Cash', 'UPI', 'Debit Card', 'Bank Transfer', 'Other'])
    .withMessage('Payment method must be one of: Cash, UPI, Debit Card, Bank Transfer, Other'),
  body('paymentMethod') // Support camelCase
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

const updateExpenseValidator = [
  param('id')
    .notEmpty().withMessage('Expense ID is required'),
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Description must be between 1 and 255 characters'),
  body('expense_date')
    .optional()
    .isISO8601().withMessage('Expense date must be a valid date'),
  body('expenseDate')
    .optional()
    .isISO8601().withMessage('Expense date must be a valid date'),
  body('payment_method')
    .optional()
    .trim()
    .isIn(['Cash', 'UPI', 'Debit Card', 'Bank Transfer', 'Other'])
    .withMessage('Payment method must be one of: Cash, UPI, Debit Card, Bank Transfer, Other'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

const expenseIdValidator = [
  param('id')
    .notEmpty().withMessage('Expense ID is required')
];

module.exports = {
  createExpenseValidator,
  updateExpenseValidator,
  expenseIdValidator
};
