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

/**
 * Formats postal code for US/Canada formats
 */
export function formatPostalCode(value: string, country?: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // If explicitly Canada or looks like Canadian postal code (letter-digit pattern)
  if (country === 'CA' || country === 'CANADA' || /^[A-Z]\d[A-Z]/.test(cleaned)) {
    // Canadian format: A1A 1A1
    if (cleaned.length <= 3) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
    }
  }
  
  // US format: 12345 or 12345-1234
  if (cleaned.length <= 5) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
  }
}

/**
 * Validates postal code format for US and Canada
 */
export function isValidPostalCode(postalCode: string, country?: string): boolean {
  const cleaned = postalCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // Canadian postal code: A1A1A1 (6 characters, alternating letter-digit)
  const canadianRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  
  // US postal code: 12345 (5 digits) or 123451234 (9 digits)
  const usRegex = /^\d{5}(\d{4})?$/;
  
  // If country is specified, validate for that country only
  if (country === 'CA' || country === 'CANADA') {
    return canadianRegex.test(cleaned);
  }
  if (country === 'US' || country === 'USA' || country === 'UNITED STATES') {
    return usRegex.test(cleaned);
  }
  
  // If no country specified, accept either format
  return canadianRegex.test(cleaned) || usRegex.test(cleaned);
}

/**
 * Formats website URL by ensuring proper protocol
 */
export function formatWebsite(value: string): string {
  if (!value) return value;
  
  const trimmed = value.trim();
  
  // If already has protocol, return as-is
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }
  
  // Add https:// if it looks like a domain
  if (trimmed.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Validates website URL format
 */
export function isValidWebsite(website: string): boolean {
  if (!website) return true; // Empty is valid (optional field)
  
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates founded year (4-digit year, not in future)
 */
export function isValidFoundedYear(year: string): boolean {
  if (!year) return true; // Empty is valid (optional field)
  
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  
  return yearNum >= 1800 && yearNum <= currentYear && year.length === 4;
}

/**
 * Validates employee count (positive integer)
 */
export function isValidEmployeeCount(count: string): boolean {
  if (!count) return true; // Empty is valid (optional field)
  
  const num = parseInt(count, 10);
  return num > 0 && num.toString() === count;
}