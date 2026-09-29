const userModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const authService = {
  /**
   * Register a new user
   */
  async register({ name, email, password, monthly_allowance = 0, currency = 'INR' }) {
    // 1. Check if email already registered
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // 3. Persist new user
    const newUser = await userModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      monthly_allowance: Number(monthly_allowance) || 0,
      currency: currency || 'INR',
      theme_preference: 'light'
    });

    // 4. Generate JWT
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    });

    return {
      user: newUser,
      token
    };
  },

  /**
   * Authenticate user and issue token
   */
  async login({ email, password }) {
    // 1. Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Verify password with bcrypt
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 3. Issue JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Strip password_hash from response
    const { password_hash, ...safeUser } = user;

    return {
      user: safeUser,
      token
    };
  },

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  /**
   * Update profile information
   */
  async updateProfile(userId, updates) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const updatedUser = await userModel.update(userId, updates);
    return updatedUser;
  }
};

module.exports = authService;
