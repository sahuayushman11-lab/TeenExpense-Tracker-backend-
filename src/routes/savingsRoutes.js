const express = require('express');
const savingsController = require('../controllers/savingsController');
const {
  createSavingsValidator,
  updateSavingsValidator,
  savingsIdValidator
} = require('../validators/savingsValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', savingsController.getSavingsGoals);
router.post('/', createSavingsValidator, validate, savingsController.createSavingsGoal);
router.get('/:id', savingsIdValidator, validate, savingsController.getSavingsGoalById);
router.put('/:id', updateSavingsValidator, validate, savingsController.updateSavingsGoal);
router.post('/:id/deposit', savingsIdValidator, validate, savingsController.depositToGoal);
router.delete('/:id', savingsIdValidator, validate, savingsController.deleteSavingsGoal);

module.exports = router;
