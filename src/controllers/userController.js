const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

const userController = {
  /**
   * Get user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Profile retrieved successfully.',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user profile settings
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Profile settings updated successfully.',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
