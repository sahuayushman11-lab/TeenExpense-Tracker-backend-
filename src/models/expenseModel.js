const crypto = require('crypto');
const { supabase, isConfigured } = require('../config/supabase');
const categoryModel = require('./categoryModel');
const { roundCurrency } = require('../utils/calculations');

const inMemoryExpenses = new Map();

const expenseModel = {
  /**
   * Create new expense for a user
   */
  async create({ userId, categoryId, amount, description, expenseDate, paymentMethod = 'Cash', notes = '' }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dateFormatted = expenseDate || new Date().toISOString().split('T')[0];

    const newExpense = {
      id,
      user_id: userId,
      category_id: categoryId,
      amount: roundCurrency(amount),
      description: description.trim(),
      expense_date: dateFormatted,
      payment_method: paymentMethod || 'Cash',
      notes: notes ? notes.trim() : '',
      created_at: now,
      updated_at: now
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([newExpense])
        .select('*, categories(id, name, icon, color)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      inMemoryExpenses.set(id, { ...newExpense });
      const category = await categoryModel.findById(categoryId);
      return {
        ...newExpense,
        categories: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null
      };
    }
  },

  /**
   * Find expenses for user with filtering, sorting and pagination
   */
  async findAll(userId, { categoryId, search, paymentMethod, startDate, endDate, minAmount, maxAmount, sortBy = 'expense_date', sortOrder = 'desc', page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isConfigured && supabase) {
      let query = supabase
        .from('expenses')
        .select('*, categories(id, name, icon, color)', { count: 'exact' })
        .eq('user_id', userId);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (paymentMethod) query = query.eq('payment_method', paymentMethod);
      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);
      if (minAmount !== undefined && minAmount !== null && minAmount !== '') query = query.gte('amount', Number(minAmount));
      if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') query = query.lte('amount', Number(maxAmount));
      if (search) {
        query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);
      }

      const isAscending = sortOrder.toLowerCase() === 'asc';
      query = query.order(sortBy, { ascending: isAscending }).range(offset, offset + limitNum - 1);

      const { data, count, error } = await query;
      if (error) throw new Error(error.message);

      return {
        expenses: data || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum)
      };
    } else {
      // In-memory query implementation
      let items = [];
      for (const expense of inMemoryExpenses.values()) {
        if (expense.user_id === userId) {
          items.push({ ...expense });
        }
      }

      // Filter
      if (categoryId) {
        items = items.filter(e => e.category_id === categoryId);
      }
      if (paymentMethod) {
        items = items.filter(e => e.payment_method.toLowerCase() === paymentMethod.toLowerCase());
      }
      if (startDate) {
        items = items.filter(e => e.expense_date >= startDate);
      }
      if (endDate) {
        items = items.filter(e => e.expense_date <= endDate);
      }
      if (minAmount !== undefined && minAmount !== null && minAmount !== '') {
        items = items.filter(e => Number(e.amount) >= Number(minAmount));
      }
      if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') {
        items = items.filter(e => Number(e.amount) <= Number(maxAmount));
      }
      if (search) {
        const query = search.toLowerCase();
        items = items.filter(e =>
          (e.description && e.description.toLowerCase().includes(query)) ||
          (e.notes && e.notes.toLowerCase().includes(query))
        );
      }

      // Sort
      const isAsc = sortOrder.toLowerCase() === 'asc';
      items.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (sortBy === 'amount') {
          valA = Number(valA);
          valB = Number(valB);
        }
        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });

      const total = items.length;
      const paginated = items.slice(offset, offset + limitNum);

      // Attach categories
      const expensesWithCategories = await Promise.all(
        paginated.map(async exp => {
          const category = await categoryModel.findById(exp.category_id);
          return {
            ...exp,
            categories: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null
          };
        })
      );

      return {
        expenses: expensesWithCategories,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };
    }
  },

  /**
   * Find expense by ID ensuring it belongs to the user
   */
  async findById(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, categories(id, name, icon, color)')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const expense = inMemoryExpenses.get(id);
      if (!expense || expense.user_id !== userId) return null;
      const category = await categoryModel.findById(expense.category_id);
      return {
        ...expense,
        categories: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null
      };
    }
  },

  /**
   * Update expense ensuring it belongs to the user
   */
  async update(id, userId, updates) {
    const now = new Date().toISOString();
    const updatePayload = {
      ...updates,
      updated_at: now
    };
    if (updates.amount !== undefined) {
      updatePayload.amount = roundCurrency(updates.amount);
    }
    delete updatePayload.id;
    delete updatePayload.user_id;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, categories(id, name, icon, color)')
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const existing = inMemoryExpenses.get(id);
      if (!existing || existing.user_id !== userId) return null;
      const updated = { ...existing, ...updatePayload };
      inMemoryExpenses.set(id, updated);
      const category = await categoryModel.findById(updated.category_id);
      return {
        ...updated,
        categories: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null
      };
    }
  },

  /**
   * Delete expense ensuring it belongs to the user
   */
  async delete(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      return !!data;
    } else {
      const existing = inMemoryExpenses.get(id);
      if (!existing || existing.user_id !== userId) return false;
      inMemoryExpenses.delete(id);
      return true;
    }
  },

  /**
   * Get all expenses for a user within a date range (used by Analytics and Insights)
   */
  async getExpensesForUserInDateRange(userId, startDate, endDate) {
    if (isConfigured && supabase) {
      let query = supabase
        .from('expenses')
        .select('*, categories(id, name, icon, color)')
        .eq('user_id', userId);

      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);

      const { data, error } = await query.order('expense_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const results = [];
      for (const expense of inMemoryExpenses.values()) {
        if (expense.user_id === userId) {
          if (startDate && expense.expense_date < startDate) continue;
          if (endDate && expense.expense_date > endDate) continue;
          results.push({ ...expense });
        }
      }
      results.sort((a, b) => a.expense_date.localeCompare(b.expense_date));

      return Promise.all(
        results.map(async exp => {
          const category = await categoryModel.findById(exp.category_id);
          return {
            ...exp,
            categories: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null
          };
        })
      );
    }
  }
};

module.exports = expenseModel;
