/**
 * Password validation utility
 * Enforces password strength requirements for user registration
 */

const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validates a password against security requirements
 * @param {string} password - The password to validate
 * @param {Object} [options] - Optional custom rules
 * @returns {{ valid: boolean, errors: string[] }} - Validation result
 */
export function validatePassword(password, options = {}) {
  const rules = { ...PASSWORD_RULES, ...options };
  const errors = [];

  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password is required'],
    };
  }

  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }

  if (password.length > rules.maxLength) {
    errors.push(`Password must not exceed ${rules.maxLength} characters`);
  }

  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (rules.requireSpecialChars && !SPECIAL_CHARS_REGEX.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Returns password requirements as a human-readable string
 * @returns {string} - Requirements description
 */
export function getPasswordRequirements() {
  return [
    `Minimum ${PASSWORD_RULES.minLength} characters`,
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one number',
    'At least one special character',
  ].join(', ');
}

export default {
  validatePassword,
  getPasswordRequirements,
  PASSWORD_RULES,
};
