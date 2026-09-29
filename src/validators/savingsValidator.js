const { body, param } = require('express-validator');

const createSavingsValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Savings goal name is required')
    .isLength({ min: 1, max: 150 }).withMessage('Goal name must be between 1 and 150 characters'),
  body('target_amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
  body('targetAmount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
  body('current_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Current amount must be a non-negative number'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Current amount must be a non-negative number'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Deadline must be a valid date (YYYY-MM-DD)'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 30 })
];

const updateSavingsValidator = [
  param('id').notEmpty().withMessage('Savings goal ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 }).withMessage('Goal name must be between 1 and 150 characters'),
  body('target_amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
  body('targetAmount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
  body('current_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Current amount must be non-negative'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Current amount must be non-negative'),
  body('deposit') // Support depositing / adding an amount
    .optional()
    .isFloat({ gt: 0 }).withMessage('Deposit amount must be greater than 0')
];

const savingsIdValidator = [
  param('id').notEmpty().withMessage('Savings goal ID is required')
];

module.exports = {
  createSavingsValidator,
  updateSavingsValidator,
  savingsIdValidator
};
