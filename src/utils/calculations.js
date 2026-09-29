/**
 * High-precision financial and analytics calculations utility.
 * Avoids common JavaScript IEEE-754 floating point arithmetic issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
 * by computing in cents (scaled integers) and formatting to fixed 2 decimal places.
 */

/**
 * Rounds a number to exactly 2 decimal places as a float.
 * @param {number|string} amount
 * @returns {number}
 */
function roundCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return 0.00;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a currency amount to integer cents (or smallest currency sub-unit).
 * @param {number|string} amount
 * @returns {number}
 */
function toCents(amount) {
  const num = Number(amount);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100);
}

/**
 * Converts integer cents back to formatted currency float.
 * @param {number} cents
 * @returns {number}
 */
function fromCents(cents) {
  if (isNaN(cents)) return 0.00;
  return Math.round(cents) / 100;
}

/**
 * Safely sums an array of currency amounts.
 * @param {Array<number|string>} amounts
 * @returns {number}
 */
function safeSum(amounts) {
  if (!Array.isArray(amounts) || amounts.length === 0) return 0.00;
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

/**
 * Safely subtracts subtrahend from minuend (a - b).
 * @param {number|string} a
 * @param {number|string} b
 * @returns {number}
 */
function safeSubtract(a, b) {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Calculates percentage: (part / total) * 100, clamped safely.
 * @param {number|string} part
 * @param {number|string} total
 * @returns {number} 0-100 rounded to 1 decimal place
 */
function calculatePercentage(part, total) {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  const pct = (p / t) * 100;
  return Math.round((pct + Number.EPSILON) * 10) / 10;
}

/**
 * Calculates average daily spending across a number of days.
 * @param {number} totalAmount
 * @param {number} daysCount
 * @returns {number}
 */
function calculateDailyAverage(totalAmount, daysCount) {
  const days = Math.max(1, parseInt(daysCount, 10) || 1);
  const totalCents = toCents(totalAmount);
  return fromCents(Math.round(totalCents / days));
}

module.exports = {
  roundCurrency,
  toCents,
  fromCents,
  safeSum,
  safeSubtract,
  calculatePercentage,
  calculateDailyAverage
};
