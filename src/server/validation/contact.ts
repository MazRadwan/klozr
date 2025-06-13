import { z } from 'zod';

export const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  contact_type: z.string().optional(),
  company_id: z.number().nullable().optional(),
  owner_user_id: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
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