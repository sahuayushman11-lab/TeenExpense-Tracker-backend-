const categoryModel = require('../models/categoryModel');
const { successResponse } = require('../utils/response');

const categoryController = {
  /**
   * Get all categories (defaults + user custom)
   * GET /api/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await categoryModel.findAll(req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Categories retrieved successfully.',
        data: { categories }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create custom category
   * POST /api/categories
   */
  async createCategory(req, res, next) {
    try {
      const { name, icon, color } = req.body;
      if (!name || !name.trim()) {
        const error = new Error('Category name is required.');
        error.statusCode = 400;
        throw error;
      }

      const category = await categoryModel.create({
        userId: req.user.id,
        name: name.trim(),
        icon: icon || 'Tag',
        color: color || '#6366f1'
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Category created successfully.',
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;
