const crypto = require('crypto');
const { supabase, isConfigured } = require('../config/supabase');
const { roundCurrency } = require('../utils/calculations');

const inMemoryBudgets = new Map();

const budgetModel = {
  /**
   * Create a new budget
   */
  async create({ userId, name, amount, period = 'monthly', startDate, endDate, categoryId = null }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Default dates if not specified
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const newBudget = {
      id,
      user_id: userId,
      category_id: categoryId || null,
      name: name.trim(),
      amount: roundCurrency(amount),
      period: period || 'monthly',
      start_date: startDate || defaultStart,
      end_date: endDate || defaultEnd,
      created_at: now,
      updated_at: now
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .insert([newBudget])
        .select('*, categories(id, name, icon, color)')
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      inMemoryBudgets.set(id, { ...newBudget });
      return { ...newBudget };
    }
  },

  /**
   * Find all budgets for a user
   */
  async findAll(userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(id, name, icon, color)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const results = [];
      for (const budget of inMemoryBudgets.values()) {
        if (budget.user_id === userId) {
          results.push({ ...budget });
        }
      }
      return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  },

  /**
   * Find budget by ID
   */
  async findById(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(id, name, icon, color)')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const budget = inMemoryBudgets.get(id);
      if (!budget || budget.user_id !== userId) return null;
      return { ...budget };
    }
  },

  /**
   * Update budget
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
        .from('budgets')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, categories(id, name, icon, color)')
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const existing = inMemoryBudgets.get(id);
      if (!existing || existing.user_id !== userId) return null;
      const updated = { ...existing, ...updatePayload };
      inMemoryBudgets.set(id, updated);
      return { ...updated };
    }
  },

  /**
   * Delete budget
   */
  async delete(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      return !!data;
    } else {
      const existing = inMemoryBudgets.get(id);
      if (!existing || existing.user_id !== userId) return false;
      inMemoryBudgets.delete(id);
      return true;
    }
  }
};

module.exports = budgetModel;
