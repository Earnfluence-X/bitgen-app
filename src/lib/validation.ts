// src/lib/validation.ts

/**
 * Sanitize text to prevent XSS attacks
 * Removes HTML tags and script tags
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onclick=/gi, '');
  
  // Limit length
  if (sanitized.length > 1000) {
    sanitized = sanitized.slice(0, 1000);
  }
  
  return sanitized.trim();
}

/**
 * Validate username - only letters, numbers, and underscores
 */
export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate transaction amount
 */
export function validateAmount(amount: number): { valid: boolean; message?: string } {
  if (amount <= 0) return { valid: false, message: 'Amount must be greater than 0' };
  if (amount > 500) return { valid: false, message: 'Maximum 500 BG per transaction' };
  if (!Number.isInteger(amount)) return { valid: false, message: 'Amount must be a whole number' };
  return { valid: true };
}

/**
 * Validate PIN
 */
export function validatePin(pin: string): { valid: boolean; message?: string } {
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, message: 'PIN must be exactly 4 digits' };
  }
  return { valid: true };
}

/**
 * Validate gig input
 */
export function validateGigInput(title: string, description: string, reward: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!title || title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (title && title.length > 80) {
    errors.push('Title must be less than 80 characters');
  }
  if (description && description.length > 300) {
    errors.push('Description must be less than 300 characters');
  }
  if (reward <= 0) {
    errors.push('Reward must be greater than 0');
  }
  if (reward > 1000) {
    errors.push('Reward cannot exceed 1000 BG');
  }
  
  return { valid: errors.length === 0, errors };
}