// Pure formatting utility functions
// No side effects, easily testable

/**
 * Formats phone number to (###) ###-#### pattern
 */
export function formatPhone(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Apply formatting based on length
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

/**
 * Formats state to uppercase
 */
export function formatState(value: string): string {
  return value.toUpperCase();
}

/**
 * Formats email to lowercase
 */
export function formatEmail(value: string): string {
  return value.toLowerCase();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone format (must be 10 digits when formatted)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}