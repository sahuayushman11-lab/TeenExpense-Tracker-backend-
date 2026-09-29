const express = require('express');
const budgetController = require('../controllers/budgetController');
const {
  createBudgetValidator,
  updateBudgetValidator,
  budgetIdValidator
} = require('../validators/budgetValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', budgetController.getBudgets);
router.post('/', createBudgetValidator, validate, budgetController.createBudget);
router.get('/:id', budgetIdValidator, validate, budgetController.getBudgetById);
router.put('/:id', updateBudgetValidator, validate, budgetController.updateBudget);
router.delete('/:id', budgetIdValidator, validate, budgetController.deleteBudget);

module.exports = router;
