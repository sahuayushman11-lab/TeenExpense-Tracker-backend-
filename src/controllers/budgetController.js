const budgetService = require('../services/budgetService');
const { successResponse } = require('../utils/response');

const budgetController = {
  /**
   * Create a new budget
   * POST /api/budgets
   */
  async createBudget(req, res, next) {
    try {
      const budget = await budgetService.createBudget(req.user.id, req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Budget created successfully.',
        data: { budget }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all budgets with spending calculations
   * GET /api/budgets
   */
  async getBudgets(req, res, next) {
    try {
      const budgets = await budgetService.getBudgets(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Budgets retrieved successfully.',
        data: { budgets }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get budget by ID
   * GET /api/budgets/:id
   */
  async getBudgetById(req, res, next) {
    try {
      const budget = await budgetService.getBudgetById(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Budget retrieved successfully.',
        data: { budget }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update budget
   * PUT /api/budgets/:id
   */
  async updateBudget(req, res, next) {
    try {
      const budget = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Budget updated successfully.',
        data: { budget }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete budget
   * DELETE /api/budgets/:id
   */
  async deleteBudget(req, res, next) {
    try {
      await budgetService.deleteBudget(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Budget deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = budgetController;
