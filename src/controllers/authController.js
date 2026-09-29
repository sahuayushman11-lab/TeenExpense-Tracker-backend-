const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

const authController = {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { name, email, password, monthly_allowance, currency } = req.body;
      const result = await authService.register({
        name,
        email,
        password,
        monthly_allowance,
        currency
      });

      // Set secure cookie if desired
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'User registered successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Login successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user (clear cookie)
   */
  async logout(req, res, next) {
    try {
      res.clearCookie('token');
      return successResponse(res, {
        statusCode: 200,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get authenticated user profile
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Current user retrieved successfully.',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update profile
   */
  async updateProfile(req, res, next) {
    try {
      const updatedUser = await authService.updateProfile(req.user.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Profile updated successfully.',
        data: { user: updatedUser }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
