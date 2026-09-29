const crypto = require('crypto');
const { supabase, isConfigured } = require('../config/supabase');

const DEFAULT_CATEGORIES = [
  { id: '11111111-1111-1111-1111-111111111101', name: 'Food & Snacks', icon: 'Utensils', color: '#f97316', is_default: true },
  { id: '11111111-1111-1111-1111-111111111102', name: 'Transport & Commute', icon: 'Bus', color: '#3b82f6', is_default: true },
  { id: '11111111-1111-1111-1111-111111111103', name: 'Education & Books', icon: 'GraduationCap', color: '#8b5cf6', is_default: true },
  { id: '11111111-1111-1111-1111-111111111104', name: 'Entertainment & Movies', icon: 'Film', color: '#ec4899', is_default: true },
  { id: '11111111-1111-1111-1111-111111111105', name: 'Shopping & Clothes', icon: 'ShoppingBag', color: '#06b6d4', is_default: true },
  { id: '11111111-1111-1111-1111-111111111106', name: 'Gaming & Apps', icon: 'Gamepad2', color: '#10b981', is_default: true },
  { id: '11111111-1111-1111-1111-111111111107', name: 'Subscriptions', icon: 'Tv', color: '#6366f1', is_default: true },
  { id: '11111111-1111-1111-1111-111111111108', name: 'Health & Fitness', icon: 'HeartPulse', color: '#ef4444', is_default: true },
  { id: '11111111-1111-1111-1111-111111111109', name: 'Personal Care', icon: 'Smile', color: '#eab308', is_default: true },
  { id: '11111111-1111-1111-1111-111111111110', name: 'Gifts & Celebrations', icon: 'Gift', color: '#d946ef', is_default: true },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Other', icon: 'MoreHorizontal', color: '#64748b', is_default: true }
];

const inMemoryCategories = new Map();
DEFAULT_CATEGORIES.forEach(cat => inMemoryCategories.set(cat.id, { ...cat, user_id: null }));

const categoryModel = {
  /**
   * Get all categories accessible by the user (default system categories + user's custom categories)
   */
  async findAll(userId) {
    if (isConfigured && supabase) {
      let query = supabase.from('categories').select('*');
      if (userId) {
        query = query.or(`is_default.eq.true,user_id.eq.${userId}`);
      } else {
        query = query.eq('is_default', true);
      }
      const { data, error } = await query.order('name');
      if (error) throw new Error(error.message);
      return data && data.length > 0 ? data : DEFAULT_CATEGORIES;
    } else {
      const results = [];
      for (const cat of inMemoryCategories.values()) {
        if (cat.is_default || cat.user_id === userId) {
          results.push({ ...cat });
        }
      }
      return results.sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  /**
   * Find category by ID
   */
  async findById(id) {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    } else {
      return inMemoryCategories.get(id) || null;
    }
  },

  /**
   * Create custom category for user
   */
  async create({ userId, name, icon = 'Tag', color = '#6366f1' }) {
    const id = crypto.randomUUID();
    const newCategory = {
      id,
      user_id: userId,
      name,
      icon,
      color,
      is_default: false,
      created_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      inMemoryCategories.set(id, newCategory);
      return { ...newCategory };
    }
  }
};

module.exports = categoryModel;
