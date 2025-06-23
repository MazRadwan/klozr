import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true; // Empty is valid
      return z.string().email().safeParse(val).success;
    }, 'Please enter a valid email address'),
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const cleaned = val.replace(/\D/g, '');
      return cleaned.length === 10;
    }, 'Phone number must be 10 digits in format (###) ###-####'),
  website: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      try {
        const url = new URL(val.startsWith('http') ? val : `https://${val}`);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Please enter a valid website URL'),
  address: z.string().optional(),
  city: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^[a-zA-Z\s\-'\.]+$/.test(val);
    }, 'City must contain only letters, spaces, hyphens, apostrophes, and periods'),
  state: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return val.length <= 50;
    }, 'State must be 50 characters or less'),
  country: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return val.length <= 50;
    }, 'Country must be 50 characters or less'),
  postal_code: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const cleaned = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      // US: 5 or 9 digits, Canada: 6 characters alternating letter-digit
      return /^\d{5}(\d{4})?$/.test(cleaned) || /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned);
    }, 'Postal code must be valid US (12345 or 12345-1234) or Canadian (A1A 1A1) format'),
  industry: z.string().optional(),
  founded: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const yearNum = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return yearNum >= 1800 && yearNum <= currentYear && val.length === 4;
    }, 'Founded year must be a 4-digit year between 1800 and current year'),
  employees: z.number()
    .optional()
    .refine((val) => {
      if (val === undefined) return true; // Optional field
      return val > 0;
    }, 'Employee count must be a positive number'),
  revenue: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  // Lead management fields
  lead_status: z.string().optional(),
  lead_temperature: z.string().optional(),
  lead_source: z.string().optional(),
  lead_assigned_date: z.string().optional(),
  lead_owner_id: z.number().optional(),
  assignContacts: z.array(z.number()).optional()
});

export type CompanyInput = z.infer<typeof companySchema>;

/**
 * Parse and validate company input data
 */
export function parseCompanyInput(data: unknown): CompanyInput {
  return companySchema.parse(data);
}