const crypto = require('crypto');
const { supabase, isConfigured } = require('../config/supabase');

// In-memory persistent cache for development mode
const inMemoryUsers = new Map();

const userModel = {
  /**
   * Create a new user
   */
  async create({ name, email, password_hash, monthly_allowance = 0, currency = 'INR', theme_preference = 'light' }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const userData = {
      id,
      name,
      email: email.toLowerCase(),
      password_hash,
      monthly_allowance: Number(monthly_allowance) || 0,
      currency: currency || 'INR',
      theme_preference: theme_preference || 'light',
      created_at: now,
      updated_at: now
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select('id, name, email, monthly_allowance, currency, theme_preference, created_at, updated_at')
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      inMemoryUsers.set(id, { ...userData });
      const { password_hash: _, ...safeUser } = userData;
      return safeUser;
    }
  },

  /**
   * Find user by email (includes password_hash for authentication)
   */
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      for (const user of inMemoryUsers.values()) {
        if (user.email === normalizedEmail) {
          return { ...user };
        }
      }
      return null;
    }
  },

  /**
   * Find user by ID (excludes password_hash for safety)
   */
  async findById(id) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, monthly_allowance, currency, theme_preference, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const user = inMemoryUsers.get(id);
      if (!user) return null;
      const { password_hash: _, ...safeUser } = user;
      return safeUser;
    }
  },

  /**
   * Update user profile
   */
  async update(id, updates) {
    const now = new Date().toISOString();
    const updatePayload = {
      ...updates,
      updated_at: now
    };

    // Remove password_hash from general profile updates
    delete updatePayload.password_hash;
    delete updatePayload.id;

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select('id, name, email, monthly_allowance, currency, theme_preference, created_at, updated_at')
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const user = inMemoryUsers.get(id);
      if (!user) return null;
      const updatedUser = { ...user, ...updatePayload };
      inMemoryUsers.set(id, updatedUser);
      const { password_hash: _, ...safeUser } = updatedUser;
      return safeUser;
    }
  }
};

module.exports = userModel;
