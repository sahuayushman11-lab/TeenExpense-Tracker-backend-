const userModel = require('../models/userModel');
const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const savingsModel = require('../models/savingsModel');
const categoryModel = require('../models/categoryModel');
const {
  safeSum,
  safeSubtract,
  calculatePercentage,
  calculateDailyAverage,
  roundCurrency
} = require('../utils/calculations');

const analyticsService = {
  /**
   * Comprehensive summary for dashboard stat cards
   */
  async getSummary(userId) {
    const user = await userModel.findById(userId);
    const monthlyAllowance = Number(user?.monthly_allowance) || 0;
    const currency = user?.currency || 'INR';

    // Current month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch this month's expenses
    const monthlyExpenses = await expenseModel.getExpensesForUserInDateRange(
      userId,
      currentMonthStart,
      currentMonthEnd
    );

    // Fetch all savings goals
    const savingsGoals = await savingsModel.findAll(userId);
    const totalSaved = safeSum(savingsGoals.map(g => g.current_amount));

    // Calculate totals
    const totalSpent = safeSum(monthlyExpenses.map(e => e.amount));
    const remainingMoney = safeSubtract(monthlyAllowance, totalSpent);

    // Days elapsed this month
    const daysElapsed = Math.max(1, now.getDate());
    const averageDailySpending = calculateDailyAverage(totalSpent, daysElapsed);
    const averageWeeklySpending = roundCurrency(averageDailySpending * 7);

    // Min and Max expense
    let largestExpense = null;
    let smallestExpense = null;

    if (monthlyExpenses.length > 0) {
      const sortedByAmount = [...monthlyExpenses].sort((a, b) => Number(b.amount) - Number(a.amount));
      largestExpense = {
        amount: Number(sortedByAmount[0].amount),
        description: sortedByAmount[0].description,
        date: sortedByAmount[0].expense_date
      };
      smallestExpense = {
        amount: Number(sortedByAmount[sortedByAmount.length - 1].amount),
        description: sortedByAmount[sortedByAmount.length - 1].description,
        date: sortedByAmount[sortedByAmount.length - 1].expense_date
      };
    }

    // Top Category
    const categoryTotals = {};
    monthlyExpenses.forEach(exp => {
      const catName = exp.categories?.name || 'Other';
      categoryTotals[catName] = safeSum([categoryTotals[catName] || 0, exp.amount]);
    });

    let topCategory = null;
    let maxCatAmount = 0;
    for (const [catName, amount] of Object.entries(categoryTotals)) {
      if (amount > maxCatAmount) {
        maxCatAmount = amount;
        topCategory = {
          name: catName,
          amount,
          percentage: calculatePercentage(amount, totalSpent)
        };
      }
    }

    // Fetch budgets for current period
    const budgets = await budgetModel.findAll(userId);
    const currentBudget = safeSum(budgets.map(b => b.amount));

    return {
      currency,
      monthlyAllowance,
      totalSpent,
      remainingMoney,
      totalSaved,
      currentBudget,
      averageDailySpending,
      averageWeeklySpending,
      largestExpense,
      smallestExpense,
      topCategory,
      transactionCount: monthlyExpenses.length,
      currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  },

  /**
   * Category spending breakdown
   */
  async getCategoryAnalytics(userId, startDate, endDate) {
    const expenses = await expenseModel.getExpensesForUserInDateRange(userId, startDate, endDate);
    const totalSpent = safeSum(expenses.map(e => e.amount));

    const categoryMap = new Map();

    for (const exp of expenses) {
      const catId = exp.category_id;
      const catName = exp.categories?.name || 'Uncategorized';
      const catColor = exp.categories?.color || '#6366f1';
      const catIcon = exp.categories?.icon || 'Tag';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          name: catName,
          color: catColor,
          icon: catIcon,
          total: 0,
          count: 0
        });
      }

      const item = categoryMap.get(catId);
      item.total = safeSum([item.total, exp.amount]);
      item.count += 1;
    }

    const categories = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      percentage: calculatePercentage(cat.total, totalSpent)
    }));

    // Sort by largest spending first
    categories.sort((a, b) => b.total - a.total);

    return {
      totalSpent,
      categories
    };
  },

  /**
   * Timeline analytics (daily, weekly, monthly series)
   */
  async getTimelineAnalytics(userId, period = 'daily') {
    const now = new Date();
    let startDate;

    if (period === 'monthly') {
      // Past 6 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    } else if (period === 'weekly') {
      // Past 8 weeks
      const d = new Date();
      d.setDate(d.getDate() - 56);
      startDate = d.toISOString().split('T')[0];
    } else {
      // Default: Last 30 days
      const d = new Date();
      d.setDate(d.getDate() - 29);
      startDate = d.toISOString().split('T')[0];
    }

    const endDate = now.toISOString().split('T')[0];
    const expenses = await expenseModel.getExpensesForUserInDateRange(userId, startDate, endDate);

    if (period === 'monthly') {
      // Group by YYYY-MM
      const monthlyBuckets = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        const label = d.toLocaleString('default', { month: 'short' });
        monthlyBuckets[key] = { date: key, label, amount: 0, count: 0 };
      }

      expenses.forEach(e => {
        const key = e.expense_date.slice(0, 7);
        if (monthlyBuckets[key]) {
          monthlyBuckets[key].amount = safeSum([monthlyBuckets[key].amount, e.amount]);
          monthlyBuckets[key].count += 1;
        }
      });

      return Object.values(monthlyBuckets);
    } else if (period === 'weekly') {
      // Group by Week
      const weeksMap = {};
      expenses.forEach(e => {
        const expDate = new Date(e.expense_date);
        const weekNum = getWeekNumber(expDate);
        const key = `W${weekNum}`;
        if (!weeksMap[key]) {
          weeksMap[key] = { label: key, amount: 0, count: 0 };
        }
        weeksMap[key].amount = safeSum([weeksMap[key].amount, e.amount]);
        weeksMap[key].count += 1;
      });
      return Object.values(weeksMap);
    } else {
      // Daily: Last 14 to 30 days continuous
      const dailyMap = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        dailyMap[dateStr] = { date: dateStr, label, amount: 0, count: 0 };
      }

      expenses.forEach(e => {
        if (dailyMap[e.expense_date]) {
          dailyMap[e.expense_date].amount = safeSum([dailyMap[e.expense_date].amount, e.amount]);
          dailyMap[e.expense_date].count += 1;
        }
      });

      return Object.values(dailyMap);
    }
  },

  /**
   * Budget analytics: total budget, actual spending, utilization
   */
  async getBudgetAnalytics(userId) {
    const budgets = await budgetModel.findAll(userId);
    if (budgets.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
        utilization: 0,
        budgets: []
      };
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const budgetBreakdown = await Promise.all(
      budgets.map(async b => {
        const expenses = await expenseModel.getExpensesForUserInDateRange(userId, b.start_date, b.end_date);
        const relevant = b.category_id ? expenses.filter(e => e.category_id === b.category_id) : expenses;
        const spent = safeSum(relevant.map(e => e.amount));
        const rem = safeSubtract(b.amount, spent);
        const util = calculatePercentage(spent, b.amount);

        totalBudget = safeSum([totalBudget, b.amount]);
        totalSpent = safeSum([totalSpent, spent]);

        return {
          id: b.id,
          name: b.name,
          budget: Number(b.amount),
          spent,
          remaining: rem,
          utilization: util,
          period: b.period
        };
      })
    );

    return {
      totalBudget,
      totalSpent,
      remaining: safeSubtract(totalBudget, totalSpent),
      utilization: calculatePercentage(totalSpent, totalBudget),
      budgets: budgetBreakdown
    };
  },

  /**
   * Savings analytics: targets, current progress, goal breakdown
   */
  async getSavingsAnalytics(userId) {
    const goals = await savingsModel.findAll(userId);
    const totalTarget = safeSum(goals.map(g => g.target_amount));
    const totalSaved = safeSum(goals.map(g => g.current_amount));
    const overallProgress = calculatePercentage(totalSaved, totalTarget);

    const goalBreakdown = goals.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      remaining: Math.max(0, safeSubtract(g.target_amount, g.current_amount)),
      progress: calculatePercentage(g.current_amount, g.target_amount),
      deadline: g.deadline,
      icon: g.icon,
      color: g.color
    }));

    return {
      totalTarget,
      totalSaved,
      remainingToSave: Math.max(0, safeSubtract(totalTarget, totalSaved)),
      overallProgress: Math.min(100, overallProgress),
      goals: goalBreakdown
    };
  }
};

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

module.exports = analyticsService;
