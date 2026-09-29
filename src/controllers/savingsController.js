const savingsService = require('../services/savingsService');
const { successResponse } = require('../utils/response');

const savingsController = {
  /**
   * Create savings goal
   * POST /api/savings
   */
  async createSavingsGoal(req, res, next) {
    try {
      const goal = await savingsService.createSavingsGoal(req.user.id, req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Savings goal created successfully.',
        data: { goal }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all savings goals
   * GET /api/savings
   */
  async getSavingsGoals(req, res, next) {
    try {
      const goals = await savingsService.getSavingsGoals(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Savings goals retrieved successfully.',
        data: { goals }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get savings goal by ID
   * GET /api/savings/:id
   */
  async getSavingsGoalById(req, res, next) {
    try {
      const goal = await savingsService.getSavingsGoalById(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Savings goal retrieved successfully.',
        data: { goal }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deposit amount into a savings goal
   * POST /api/savings/:id/deposit
   */
  async depositToGoal(req, res, next) {
    try {
      const { amount } = req.body;
      if (!amount || Number(amount) <= 0) {
        const error = new Error('Deposit amount must be a positive number.');
        error.statusCode = 400;
        throw error;
      }

      const updatedGoal = await savingsService.depositToGoal(req.user.id, req.params.id, Number(amount));
      return successResponse(res, {
        statusCode: 200,
        message: `Successfully deposited ${amount} to savings goal!`,
        data: { goal: updatedGoal }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update savings goal
   * PUT /api/savings/:id
   */
  async updateSavingsGoal(req, res, next) {
    try {
      const goal = await savingsService.updateSavingsGoal(req.user.id, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Savings goal updated successfully.',
        data: { goal }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete savings goal
   * DELETE /api/savings/:id
   */
  async deleteSavingsGoal(req, res, next) {
    try {
      await savingsService.deleteSavingsGoal(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Savings goal deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = savingsController;
