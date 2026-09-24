/**
 * Jeroma Farmers Enterprise Security Utilities
 * PII masking, input sanitization, and audit trail helpers.
 */

/**
 * Masks a phone number for display to prevent PII harvesting.
 * Example: "+256 773 623 196" -> "+256 773 *** 196"
 */
export const maskPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.trim();
  if (cleaned.length < 8) return cleaned;
  const start = cleaned.slice(0, Math.min(8, cleaned.length - 4));
  const end = cleaned.slice(-3);
  return `${start} *** ${end}`;
};

/**
 * Masks a National Identification Number (NIN).
 * Example: "CM90045102ABCD" -> "CM90******BCD"
 */
export const maskNIN = (nin) => {
  if (!nin || typeof nin !== 'string') return '';
  const trimmed = nin.trim();
  if (trimmed.length < 6) return '******';
  return `${trimmed.slice(0, 4)}******${trimmed.slice(-3)}`;
};

/**
 * Sanitizes input strings against basic XSS vectors and script injection.
 */
export const sanitizeInput = (val) => {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
    .trim();
};

/**
 * Generates an immutable audit log entry.
 */
export const createAuditLog = ({ action, entity, entityId, details, user }) => ({
  id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  timestamp: new Date().toISOString(),
  action,
  entity,
  entityId: entityId || 'N/A',
  details: details || {},
  performedBy: {
    username: user?.username || 'system',
    role: user?.role || 'anonymous',
    department: user?.department || 'N/A'
  }
});
