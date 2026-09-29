const expenseService = require('../services/expenseService');
const { successResponse } = require('../utils/response');

const expenseController = {
  /**
   * Create a new expense
   * POST /api/expenses
   */
  async createExpense(req, res, next) {
    try {
      const expense = await expenseService.createExpense(req.user.id, req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Expense created successfully.',
        data: { expense }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all expenses for current user with filters & pagination
   * GET /api/expenses
   */
  async getExpenses(req, res, next) {
    try {
      const result = await expenseService.getExpenses(req.user.id, req.query);
      return successResponse(res, {
        statusCode: 200,
        message: 'Expenses retrieved successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single expense
   * GET /api/expenses/:id
   */
  async getExpenseById(req, res, next) {
    try {
      const expense = await expenseService.getExpenseById(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Expense retrieved successfully.',
        data: { expense }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update expense
   * PUT /api/expenses/:id
   */
  async updateExpense(req, res, next) {
    try {
      const expense = await expenseService.updateExpense(req.user.id, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Expense updated successfully.',
        data: { expense }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete expense
   * DELETE /api/expenses/:id
   */
  async deleteExpense(req, res, next) {
    try {
      await expenseService.deleteExpense(req.user.id, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Expense deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = expenseController;
