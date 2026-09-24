/**
 * Jeroma Farmers Backend Security Utilities
 * Input sanitization, password policy, and audit logging.
 */

const sanitizeInput = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
    .trim();
};

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
};

const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.trim();
  if (cleaned.length < 8) return cleaned;
  return `${cleaned.slice(0, 8)} *** ${cleaned.slice(-3)}`;
};

module.exports = {
  sanitizeInput,
  validatePasswordStrength,
  maskPhone
};
