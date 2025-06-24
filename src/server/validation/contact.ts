import { z } from 'zod';

// Phone validation: must be 10 digits when cleaned of formatting
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

// Postal code validation for US/Canada
const postalCodeRegex = /^(\d{5}(-\d{4})?|[A-Z]\d[A-Z] \d[A-Z]\d)$/;

export const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const cleaned = val.replace(/\D/g, '');
      return cleaned.length === 10;
    }, 'Phone number must be 10 digits in format (###) ###-####'),
  contact_type: z.string().optional(),
  company_id: z.number().nullable().optional(),
  owner_user_id: z.number().optional(),
  address: z.string().optional(),
  city: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^[a-zA-Z\s\-'\.]+$/.test(val);
    }, 'City must contain only letters, spaces, hyphens, apostrophes, and periods'),
  state_province: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return val.length <= 50;
    }, 'State/Province must be 50 characters or less'),
  postal_code: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const cleaned = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      // US: 5 or 9 digits, Canada: 6 characters alternating letter-digit
      return /^\d{5}(\d{4})?$/.test(cleaned) || /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned);
    }, 'Postal code must be valid US (12345 or 12345-1234) or Canadian (A1A 1A1) format'),
  is_primary: z.boolean().optional(),
  type: z.string().optional(),
  // Lead fields for bi-directional sync inheritance
  lead_status: z.string().nullable().optional(),
  lead_temperature: z.string().nullable().optional(),
  lead_source: z.string().nullable().optional(),
  lead_owner_id: z.number().nullable().optional(),
  lead_assigned_date: z.string().nullable().optional(),
  created_at: z.string().optional()
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Parse and validate contact input data
 */
export function parseContactInput(data: unknown): ContactInput {
  return contactSchema.parse(data);
}