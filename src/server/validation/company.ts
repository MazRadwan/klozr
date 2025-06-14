import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  employees: z.number().optional(),
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