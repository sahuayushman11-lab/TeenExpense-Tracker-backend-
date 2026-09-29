const expenseModel = require('../models/expenseModel');
const categoryModel = require('../models/categoryModel');

const expenseService = {
  /**
   * Create new expense
   */
  async createExpense(userId, expenseData) {
    const categoryId = expenseData.category_id || expenseData.categoryId;
    const amount = Number(expenseData.amount);
    const description = expenseData.description;
    const expenseDate = expenseData.expense_date || expenseData.expenseDate;
    const paymentMethod = expenseData.payment_method || expenseData.paymentMethod || 'Cash';
    const notes = expenseData.notes || '';

    // Verify category exists
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      const error = new Error('Selected category does not exist.');
      error.statusCode = 400;
      throw error;
    }

    return expenseModel.create({
      userId,
      categoryId,
      amount,
      description,
      expenseDate,
      paymentMethod,
      notes
    });
  },

  /**
   * List expenses with filters, pagination, and sorting
   */
  async getExpenses(userId, query) {
    const {
      category_id,
      categoryId,
      search,
      payment_method,
      paymentMethod,
      start_date,
      startDate,
      end_date,
      endDate,
      min_amount,
      minAmount,
      max_amount,
      maxAmount,
      sort_by,
      sortBy,
      sort_order,
      sortOrder,
      page,
      limit,
      date_filter
    } = query;

    let computedStartDate = startDate || start_date;
    let computedEndDate = endDate || end_date;

    // Handle convenient presets: today, this_week, this_month, last_month
    const now = new Date();
    if (date_filter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      computedStartDate = todayStr;
      computedEndDate = todayStr;
    } else if (date_filter === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      computedStartDate = firstDay.toISOString().split('T')[0];
      computedEndDate = new Date().toISOString().split('T')[0];
    } else if (date_filter === 'this_month') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      computedStartDate = firstDayOfMonth.toISOString().split('T')[0];
      computedEndDate = lastDayOfMonth.toISOString().split('T')[0];
    } else if (date_filter === 'last_month') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      computedStartDate = firstDayLastMonth.toISOString().split('T')[0];
      computedEndDate = lastDayLastMonth.toISOString().split('T')[0];
    }

    return expenseModel.findAll(userId, {
      categoryId: categoryId || category_id,
      search,
      paymentMethod: paymentMethod || payment_method,
      startDate: computedStartDate,
      endDate: computedEndDate,
      minAmount: minAmount || min_amount,
      maxAmount: maxAmount || max_amount,
      sortBy: sortBy || sort_by || 'expense_date',
      sortOrder: sortOrder || sort_order || 'desc',
      page,
      limit
    });
  },

  /**
   * Get single expense by ID
   */
  async getExpenseById(userId, id) {
    const expense = await expenseModel.findById(id, userId);
    if (!expense) {
      const error = new Error('Expense not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return expense;
  },

  /**
   * Update expense
   */
  async updateExpense(userId, id, updates) {
    // Verify expense exists and belongs to user
    const existing = await expenseModel.findById(id, userId);
    if (!existing) {
      const error = new Error('Expense not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const categoryId = updates.category_id || updates.categoryId;
    if (categoryId) {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        const error = new Error('Selected category does not exist.');
        error.statusCode = 400;
        throw error;
      }
    }

    const payload = {};
    if (updates.amount !== undefined) payload.amount = Number(updates.amount);
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (categoryId) payload.category_id = categoryId;
    if (updates.expense_date || updates.expenseDate) payload.expense_date = updates.expense_date || updates.expenseDate;
    if (updates.payment_method || updates.paymentMethod) payload.payment_method = updates.payment_method || updates.paymentMethod;
    if (updates.notes !== undefined) payload.notes = updates.notes ? updates.notes.trim() : '';

    return expenseModel.update(id, userId, payload);
  },

  /**
   * Delete expense
   */
  async deleteExpense(userId, id) {
    const existing = await expenseModel.findById(id, userId);
    if (!existing) {
      const error = new Error('Expense not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return expenseModel.delete(id, userId);
  }
};

module.exports = expenseService;
