const savingsModel = require('../models/savingsModel');
const { safeSum, safeSubtract, calculatePercentage, roundCurrency } = require('../utils/calculations');

const savingsService = {
  /**
   * Create new savings goal
   */
  async createSavingsGoal(userId, data) {
    const name = data.name;
    const targetAmount = Number(data.target_amount || data.targetAmount);
    const currentAmount = Number(data.current_amount || data.currentAmount || 0);
    const deadline = data.deadline || null;
    const icon = data.icon || 'Target';
    const color = data.color || '#10b981';

    return savingsModel.create({
      userId,
      name,
      targetAmount,
      currentAmount,
      deadline,
      icon,
      color
    });
  },

  /**
   * Get all savings goals with calculated progress metrics
   */
  async getSavingsGoals(userId) {
    const goals = await savingsModel.findAll(userId);

    return goals.map(goal => {
      const target = Number(goal.target_amount);
      const current = Number(goal.current_amount);
      const progress = calculatePercentage(current, target);
      const remaining = Math.max(0, safeSubtract(target, current));
      const isAchieved = current >= target;

      // Calculate days left if deadline exists
      let daysLeft = null;
      if (goal.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(goal.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const diffTime = deadlineDate - today;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...goal,
        progress: Math.min(100, progress),
        actual_progress: progress,
        remaining,
        is_achieved: isAchieved,
        days_left: daysLeft
      };
    });
  },

  /**
   * Get single savings goal by ID
   */
  async getSavingsGoalById(userId, id) {
    const goal = await savingsModel.findById(id, userId);
    if (!goal) {
      const error = new Error('Savings goal not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const target = Number(goal.target_amount);
    const current = Number(goal.current_amount);
    const progress = calculatePercentage(current, target);
    const remaining = Math.max(0, safeSubtract(target, current));

    return {
      ...goal,
      progress: Math.min(100, progress),
      remaining,
      is_achieved: current >= target
    };
  },

  /**
   * Deposit amount into a savings goal
   */
  async depositToGoal(userId, id, depositAmount) {
    const goal = await savingsModel.findById(id, userId);
    if (!goal) {
      const error = new Error('Savings goal not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const newCurrent = safeSum([goal.current_amount, depositAmount]);
    return savingsModel.update(id, userId, {
      current_amount: newCurrent
    });
  },

  /**
   * Update savings goal
   */
  async updateSavingsGoal(userId, id, updates) {
    const goal = await savingsModel.findById(id, userId);
    if (!goal) {
      const error = new Error('Savings goal not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.target_amount !== undefined || updates.targetAmount !== undefined) {
      payload.target_amount = Number(updates.target_amount || updates.targetAmount);
    }
    if (updates.current_amount !== undefined || updates.currentAmount !== undefined) {
      payload.current_amount = Number(updates.current_amount || updates.currentAmount);
    }
    if (updates.deposit !== undefined) {
      payload.current_amount = safeSum([goal.current_amount, updates.deposit]);
    }
    if (updates.deadline !== undefined) payload.deadline = updates.deadline || null;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.color !== undefined) payload.color = updates.color;

    return savingsModel.update(id, userId, payload);
  },

  /**
   * Delete savings goal
   */
  async deleteSavingsGoal(userId, id) {
    const goal = await savingsModel.findById(id, userId);
    if (!goal) {
      const error = new Error('Savings goal not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }
    return savingsModel.delete(id, userId);
  }
};

module.exports = savingsService;
