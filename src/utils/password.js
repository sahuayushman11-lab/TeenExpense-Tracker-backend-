const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcryptjs.
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Password hash
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a stored bcrypt hash.
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Stored hash
 * @returns {Promise<boolean>} - True if matching, false otherwise
 */
async function comparePassword(password, hashedPassword) {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
};
