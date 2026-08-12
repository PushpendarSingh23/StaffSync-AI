/**
 * escapeRegex
 * Escapes all special regex metacharacters in a string so it can be safely
 * passed to `new RegExp(escaped, 'i')` without triggering a ReDoS attack.
 *
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;
