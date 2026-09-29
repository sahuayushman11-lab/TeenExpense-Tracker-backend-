const crypto = require('crypto');
const { supabase, isConfigured } = require('../config/supabase');
const { roundCurrency } = require('../utils/calculations');

const inMemorySavings = new Map();

const savingsModel = {
  /**
   * Create a new savings goal
   */
  async create({ userId, name, targetAmount, currentAmount = 0, deadline = null, icon = 'Target', color = '#10b981' }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newGoal = {
      id,
      user_id: userId,
      name: name.trim(),
      target_amount: roundCurrency(targetAmount),
      current_amount: roundCurrency(currentAmount || 0),
      deadline: deadline || null,
      icon: icon || 'Target',
      color: color || '#10b981',
      created_at: now,
      updated_at: now
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([newGoal])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      inMemorySavings.set(id, { ...newGoal });
      return { ...newGoal };
    }
  },

  /**
   * Find all savings goals for user
   */
  async findAll(userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const results = [];
      for (const goal of inMemorySavings.values()) {
        if (goal.user_id === userId) {
          results.push({ ...goal });
        }
      }
      return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  },

  /**
   * Find savings goal by ID
   */
  async findById(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const goal = inMemorySavings.get(id);
      if (!goal || goal.user_id !== userId) return null;
      return { ...goal };
    }
  },

  /**
   * Update savings goal
   */
  async update(id, userId, updates) {
    const now = new Date().toISOString();
    const updatePayload = {
      ...updates,
      updated_at: now
    };
    if (updates.target_amount !== undefined) updatePayload.target_amount = roundCurrency(updates.target_amount);
    if (updates.current_amount !== undefined) updatePayload.current_amount = roundCurrency(updates.current_amount);
    delete updatePayload.id;
    delete updatePayload.user_id;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const existing = inMemorySavings.get(id);
      if (!existing || existing.user_id !== userId) return null;
      const updated = { ...existing, ...updatePayload };
      inMemorySavings.set(id, updated);
      return { ...updated };
    }
  },

  /**
   * Delete savings goal
   */
  async delete(id, userId) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      return !!data;
    } else {
      const existing = inMemorySavings.get(id);
      if (!existing || existing.user_id !== userId) return false;
      inMemorySavings.delete(id);
      return true;
    }
  }
};

module.exports = savingsModel;
