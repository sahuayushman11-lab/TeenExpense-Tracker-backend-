const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/response');

const analyticsController = {
  /**
   * Comprehensive summary
   * GET /api/analytics/summary
   */
  async getSummary(req, res, next) {
    try {
      const summary = await analyticsService.getSummary(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Summary analytics retrieved successfully.',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Category analytics
   * GET /api/analytics/category
   */
  async getCategoryAnalytics(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const data = await analyticsService.getCategoryAnalytics(req.user.id, start_date, end_date);
      return successResponse(res, {
        statusCode: 200,
        message: 'Category analytics retrieved successfully.',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Timeline analytics (daily, weekly, monthly)
   * GET /api/analytics/timeline
   */
  async getTimelineAnalytics(req, res, next) {
    try {
      const { period = 'daily' } = req.query;
      const timeline = await analyticsService.getTimelineAnalytics(req.user.id, period);
      return successResponse(res, {
        statusCode: 200,
        message: 'Timeline analytics retrieved successfully.',
        data: { timeline }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Budget analytics
   * GET /api/analytics/budget
   */
  async getBudgetAnalytics(req, res, next) {
    try {
      const budgetData = await analyticsService.getBudgetAnalytics(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Budget analytics retrieved successfully.',
        data: budgetData
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Savings analytics
   * GET /api/analytics/savings
   */
  async getSavingsAnalytics(req, res, next) {
    try {
      const savingsData = await analyticsService.getSavingsAnalytics(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Savings analytics retrieved successfully.',
        data: savingsData
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = analyticsController;
