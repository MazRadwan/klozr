import { z } from 'zod';

// Base activity type validation
export const activityTypeSchema = z.enum(['call', 'email', 'note', 'meeting', 'task']);
export const entityTypeSchema = z.enum(['contact', 'company', 'deal']);
export const activityStatusSchema = z.enum(['completed', 'scheduled', 'pending', 'cancelled']);
export const participantRoleSchema = z.enum(['primary', 'participant', 'mentioned']);

// Participant schema
export const participantSchema = z.object({
  entity_type: entityTypeSchema,
  entity_id: z.number().int().positive(),
  role: participantRoleSchema.default('participant').optional()
});

// Create activity schema
export const createActivitySchema = z.object({
  activity_type: activityTypeSchema,
  primary_entity_type: entityTypeSchema,
  primary_entity_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(10000).optional(),
  data: z.record(z.any()).optional(),
  parent_id: z.number().int().positive().optional(),
  status: activityStatusSchema.default('completed').optional(),
  scheduled_at: z.string().datetime().optional(),
  participants: z.array(participantSchema).optional()
}).refine((data) => {
  // If status is scheduled, scheduled_at must be provided
  if (data.status === 'scheduled') {
    return !!data.scheduled_at;
  }
  return true;
}, {
  message: "scheduled_at is required when status is 'scheduled'",
  path: ["scheduled_at"]
});

// Update activity schema (all fields optional except those that shouldn't change)
export const updateActivitySchema = z.object({
  activity_type: activityTypeSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(10000).optional(),
  data: z.record(z.any()).optional(),
  status: activityStatusSchema.optional(),
  scheduled_at: z.string().datetime().optional()
}).refine((data) => {
  // If status is scheduled, scheduled_at must be provided
  if (data.status === 'scheduled') {
    return !!data.scheduled_at;
  }
  return true;
}, {
  message: "scheduled_at is required when status is 'scheduled'",
  path: ["scheduled_at"]
});

// Quick action schemas for convenience endpoints
export const createNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(10000),
  user_id: z.number().int().positive()
});

export const logCallSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(10000).optional(),
  user_id: z.number().int().positive(),
  duration: z.number().int().min(0).optional(),
  outcome: z.string().max(100).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  followUpRequired: z.boolean().optional()
});

export const scheduleFollowUpSchema = z.object({
  activity_type: activityTypeSchema.default('task'),
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(10000),
  user_id: z.number().int().positive(),
  scheduled_at: z.string().datetime(),
  parent_id: z.number().int().positive().optional()
});

// Sorting validation schemas
export const sortFieldSchema = z.enum(['created_at', 'title', 'activity_type', 'status']);
export const sortOrderSchema = z.enum(['asc', 'desc']);

// Activity query parameters schema
export const activityQuerySchema = z.object({
  activity_type: z.union([
    activityTypeSchema,
    z.string().transform(val => val.split(',').filter(t => ['call', 'email', 'note', 'meeting', 'task'].includes(t) as any))
  ]).optional(), // Support single type or comma-separated types
  status: activityStatusSchema.optional(),
  q: z.string().max(255).optional(), // Search query parameter
  sort_by: sortFieldSchema.optional(), // Sort field parameter
  sort_order: sortOrderSchema.default('desc').optional(), // Sort order parameter
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(100)).default('20').optional(),
  offset: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0)).default('0').optional(),
  include_participants: z.string().transform(val => val === 'true').pipe(z.boolean()).default('false').optional(),
  include_user: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true').optional()
});

// Type exports
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type LogCallInput = z.infer<typeof logCallSchema>;
export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;
export type ActivityQueryParams = z.infer<typeof activityQuerySchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;

/**
 * Parse and validate activity creation input
 */
export function parseCreateActivityInput(input: unknown): CreateActivityInput {
  return createActivitySchema.parse(input);
}

/**
 * Parse and validate activity update input
 */
export function parseUpdateActivityInput(input: unknown): UpdateActivityInput {
  return updateActivitySchema.parse(input);
}

/**
 * Parse and validate note creation input
 */
export function parseCreateNoteInput(input: unknown): CreateNoteInput {
  return createNoteSchema.parse(input);
}

/**
 * Parse and validate call logging input
 */
export function parseLogCallInput(input: unknown): LogCallInput {
  return logCallSchema.parse(input);
}

/**
 * Parse and validate follow-up scheduling input
 */
export function parseScheduleFollowUpInput(input: unknown): ScheduleFollowUpInput {
  return scheduleFollowUpSchema.parse(input);
}

/**
 * Parse and validate activity query parameters
 */
export function parseActivityQueryParams(searchParams: URLSearchParams): ActivityQueryParams {
  const params = Object.fromEntries(searchParams);
  return activityQuerySchema.parse(params);
}