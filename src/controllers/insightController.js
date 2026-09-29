const insightService = require('../services/insightService');
const { successResponse } = require('../utils/response');

const insightController = {
  /**
   * Get smart rule-based spending insights
   * GET /api/insights
   */
  async getInsights(req, res, next) {
    try {
      const insights = await insightService.generateInsights(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Spending insights generated successfully.',
        data: { insights }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = insightController;
