const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const savingsModel = require('../models/savingsModel');
const userModel = require('../models/userModel');
const { safeSum, calculatePercentage, safeSubtract } = require('../utils/calculations');

const insightService = {
  /**
   * Evaluates user's real financial data through the rule-based insight engine.
   * Produces transparent, educational, and actionable recommendations.
   * Configurable thresholds can later be fine-tuned or extended with an AI service.
   */
  async generateInsights(userId) {
    const user = await userModel.findById(userId);
    const currency = user?.currency || 'INR';
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const monthlyAllowance = Number(user?.monthly_allowance) || 0;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch this month's expenses
    const expenses = await expenseModel.getExpensesForUserInDateRange(
      userId,
      currentMonthStart,
      currentMonthEnd
    );

    // Fetch budgets and savings goals
    const budgets = await budgetModel.findAll(userId);
    const savingsGoals = await savingsModel.findAll(userId);

    const totalSpent = safeSum(expenses.map(e => e.amount));
    const insights = [];

    // -------------------------------------------------------------
    // Rule 1: High Category Spending (Threshold: >= 35% of total)
    // -------------------------------------------------------------
    if (totalSpent > 0) {
      const categoryMap = {};
      expenses.forEach(e => {
        const catName = e.categories?.name || 'General';
        categoryMap[catName] = safeSum([categoryMap[catName] || 0, e.amount]);
      });

      for (const [catName, catTotal] of Object.entries(categoryMap)) {
        const pct = calculatePercentage(catTotal, totalSpent);
        if (pct >= 35) {
          insights.push({
            id: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'category_review',
            severity: pct >= 50 ? 'warning' : 'info',
            title: `High ${catName} Spending`,
            message: `${catName} accounts for ${pct}% (${currencySymbol}${catTotal}) of your spending this month. Review your purchases here to see where you can trim non-essential items.`,
            category: catName,
            actionText: 'View Expenses',
            actionLink: '/expenses'
          });
        }
      }
    }

    // -------------------------------------------------------------
    // Rule 2: Budget Warning (Threshold: >= 80% and >= 100% utilized)
    // -------------------------------------------------------------
    for (const budget of budgets) {
      const relevantExpenses = budget.category_id
        ? expenses.filter(e => e.category_id === budget.category_id)
        : expenses;
      const spentOnBudget = safeSum(relevantExpenses.map(e => e.amount));
      const budgetAmount = Number(budget.amount);
      const utilization = calculatePercentage(spentOnBudget, budgetAmount);

      if (utilization >= 100) {
        insights.push({
          id: `budget-exceeded-${budget.id}`,
          type: 'budget_warning',
          severity: 'warning',
          title: `Budget Exceeded: ${budget.name}`,
          message: `You have spent ${currencySymbol}${spentOnBudget} out of your ${currencySymbol}${budgetAmount} budget (${utilization}%). Consider pausing non-critical purchases until next month.`,
          actionText: 'Review Budget',
          actionLink: '/budgets'
        });
      } else if (utilization >= 80) {
        insights.push({
          id: `budget-warning-${budget.id}`,
          type: 'budget_warning',
          severity: 'warning',
          title: `Budget Warning: ${budget.name}`,
          message: `You have used ${utilization}% of your ${currencySymbol}${budgetAmount} budget. Only ${currencySymbol}${safeSubtract(budgetAmount, spentOnBudget)} remains.`,
          actionText: 'Manage Budgets',
          actionLink: '/budgets'
        });
      }
    }

    // -------------------------------------------------------------
    // Rule 3: Frequent Small Purchases ("Micro-leaks")
    // Purchases <= 100 INR (or 5 USD) happening 4 or more times
    // -------------------------------------------------------------
    const microThreshold = currency === 'INR' ? 100 : 5;
    const smallPurchases = expenses.filter(e => Number(e.amount) <= microThreshold);

    if (smallPurchases.length >= 4) {
      const smallTotal = safeSum(smallPurchases.map(e => e.amount));
      insights.push({
        id: 'micro-spending-leak',
        type: 'frequent_small_purchases',
        severity: 'info',
        title: 'Watch Out for Micro-Purchases',
        message: `You made ${smallPurchases.length} small purchases under ${currencySymbol}${microThreshold}, totaling ${currencySymbol}${smallTotal}. Small daily treats add up quickly over a month!`,
        actionText: 'Inspect Purchases',
        actionLink: '/expenses'
      });
    }

    // -------------------------------------------------------------
    // Rule 4: Savings Milestone Progress
    // -------------------------------------------------------------
    for (const goal of savingsGoals) {
      const target = Number(goal.target_amount);
      const current = Number(goal.current_amount);
      const progress = calculatePercentage(current, target);

      if (progress >= 100) {
        insights.push({
          id: `goal-completed-${goal.id}`,
          type: 'savings_progress',
          severity: 'success',
          title: `Goal Achieved: ${goal.name}! 🎉`,
          message: `Congratulations! You reached your savings target of ${currencySymbol}${target} for "${goal.name}". Fantastic discipline!`,
          actionText: 'View Savings',
          actionLink: '/savings'
        });
      } else if (progress >= 50) {
        insights.push({
          id: `goal-halfway-${goal.id}`,
          type: 'savings_progress',
          severity: 'success',
          title: `Halfway to ${goal.name}!`,
          message: `You have saved ${currencySymbol}${current} (${progress}% of your ${currencySymbol}${target} goal). Keep up the great work!`,
          actionText: 'Add Deposit',
          actionLink: '/savings'
        });
      }
    }

    // -------------------------------------------------------------
    // Rule 5: Allowance Health Check
    // -------------------------------------------------------------
    if (monthlyAllowance > 0) {
      if (totalSpent > monthlyAllowance) {
        const overspent = safeSubtract(totalSpent, monthlyAllowance);
        insights.push({
          id: 'allowance-deficit',
          type: 'allowance_alert',
          severity: 'warning',
          title: 'Allowance Deficit Alert',
          message: `You have spent ${currencySymbol}${totalSpent}, exceeding your monthly allowance by ${currencySymbol}${overspent}. Plan ahead to avoid borrowing.`,
          actionText: 'Adjust Allowance',
          actionLink: '/settings'
        });
      } else {
        const remaining = safeSubtract(monthlyAllowance, totalSpent);
        const dayOfMonth = now.getDate();
        // If mid-month and more than 60% remaining
        if (dayOfMonth >= 15 && remaining >= monthlyAllowance * 0.5) {
          insights.push({
            id: 'healthy-spending-habit',
            type: 'positive_habit',
            severity: 'success',
            title: 'Terrific Pacing!',
            message: `You are midway through the month and still have ${currencySymbol}${remaining} (${calculatePercentage(remaining, monthlyAllowance)}%) of your allowance intact. Great financial self-control!`,
            actionText: 'Track Goals',
            actionLink: '/dashboard'
          });
        }
      }
    }

    // -------------------------------------------------------------
    // Rule 6: General Beginner Tip if few or zero insights
    // -------------------------------------------------------------
    if (insights.length === 0) {
      insights.push({
        id: 'beginner-healthy-habit',
        type: 'educational_tip',
        severity: 'info',
        title: 'The 50/30/20 Teen Habit',
        message: 'A great foundation for young adults: Try using 50% of your allowance for needs (school, commute), 30% for fun, and tucking 20% right into your savings goal.',
        actionText: 'Set a Savings Goal',
        actionLink: '/savings'
      });
    }

    return insights;
  }
};

module.exports = insightService;
