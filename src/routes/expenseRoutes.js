const express = require('express');
const expenseController = require('../controllers/expenseController');
const {
  createExpenseValidator,
  updateExpenseValidator,
  expenseIdValidator
} = require('../validators/expenseValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication on all expense endpoints
router.use(authenticate);

router.get('/', expenseController.getExpenses);
router.post('/', createExpenseValidator, validate, expenseController.createExpense);
router.get('/:id', expenseIdValidator, validate, expenseController.getExpenseById);
router.put('/:id', updateExpenseValidator, validate, expenseController.updateExpense);
router.delete('/:id', expenseIdValidator, validate, expenseController.deleteExpense);

module.exports = router;
