import { z } from 'zod';

export const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().optional(),
  stage: z.string().optional(),
  close_date: z.string().optional(),
  contact_id: z.number().optional(),
  company_id: z.number().optional(),
  sales_rep_id: z.number().optional(),
  offering_id: z.number().optional(),
  deal_notes: z.string().optional(),
});

export type DealInput = z.infer<typeof dealSchema>;

/**
 * Parse and validate deal input data
 */
export function parseDealInput(data: unknown): DealInput {
  return dealSchema.parse(data);
}