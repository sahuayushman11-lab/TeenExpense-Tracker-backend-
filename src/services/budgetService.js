const budgetModel = require('../models/budgetModel');
const expenseModel = require('../models/expenseModel');
const { safeSum, safeSubtract, calculatePercentage } = require('../utils/calculations');

const budgetService = {
  /**
   * Create a new budget
   */
  async createBudget(userId, data) {
    const name = data.name;
    const amount = Number(data.amount);
    const period = data.period || 'monthly';
    const startDate = data.start_date || data.startDate;
    const endDate = data.end_date || data.endDate;
    const categoryId = data.category_id || data.categoryId || null;

    return budgetModel.create({
      userId,
      name,
      amount,
      period,
      startDate,
      endDate,
      categoryId
    });
  },

  /**
   * Get all budgets with actual real-time spending calculations
   */
  async getBudgets(userId) {
    const budgets = await budgetModel.findAll(userId);

    // Calculate real-time actual spending for each budget
    const enrichedBudgets = await Promise.all(
      budgets.map(async budget => {
        // Fetch expenses falling within this budget's timeframe
        const expenses = await expenseModel.getExpensesForUserInDateRange(
          userId,
          budget.start_date,
          budget.end_date
        );

        // If category is assigned, filter by that category
        const relevantExpenses = budget.category_id
          ? expenses.filter(e => e.category_id === budget.category_id)
          : expenses;

        const spent = safeSum(relevantExpenses.map(e => e.amount));
        const remaining = safeSubtract(budget.amount, spent);
        const utilization = calculatePercentage(spent, budget.amount);

        let status = 'healthy';
        if (utilization >= 100) {
          status = 'exceeded';
        } else if (utilization >= 80) {
          status = 'warning';
        }

        return {
          ...budget,
          spent,
          remaining,
          utilization,
          status,
          transaction_count: relevantExpenses.length
        };
      })
    );

    return enrichedBudgets;
  },

  /**
   * Get budget by ID with spending calculations
   */
  async getBudgetById(userId, id) {
    const budget = await budgetModel.findById(id, userId);
    if (!budget) {
      const error = new Error('Budget not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const expenses = await expenseModel.getExpensesForUserInDateRange(
      userId,
      budget.start_date,
      budget.end_date
    );

    const relevantExpenses = budget.category_id
      ? expenses.filter(e => e.category_id === budget.category_id)
      : expenses;

    const spent = safeSum(relevantExpenses.map(e => e.amount));
    const remaining = safeSubtract(budget.amount, spent);
    const utilization = calculatePercentage(spent, budget.amount);

    return {
      ...budget,
      spent,
      remaining,
      utilization,
      status: utilization >= 100 ? 'exceeded' : utilization >= 80 ? 'warning' : 'healthy',
      transaction_count: relevantExpenses.length
    };
  },

  /**
   * Update budget
   */
  async updateBudget(userId, id, updates) {
    const budget = await budgetModel.findById(id, userId);
    if (!budget) {
      const error = new Error('Budget not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return budgetModel.update(id, userId, updates);
  },

  /**
   * Delete budget
   */
  async deleteBudget(userId, id) {
    const budget = await budgetModel.findById(id, userId);
    if (!budget) {
      const error = new Error('Budget not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return budgetModel.delete(id, userId);
  }
};

module.exports = budgetService;
