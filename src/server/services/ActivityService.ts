import { db } from '@/lib/db';
import { ActivityRepository, ActivityParticipantRepository, ContactRepository, CompanyRepository, DealRepository } from '@/server/repositories';
import { LeadSyncService } from './LeadSyncService';
import { contacts, companies, deals } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { 
  Activity, 
  CreateActivityInput, 
  UpdateActivityInput, 
  ActivityType, 
  EntityType,
  ActivityQueryOptions,
  CreateActivityData
} from '@/lib/types/activities';

/**
 * Interface for call data when logging calls
 */
export interface CallData {
  duration?: number;
  outcome?: string;
  notes?: string;
  followUpRequired?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Activity Service - handles business logic for activity management
 * Includes auto-participant assignment and entity relationship management
 */
export class ActivityService {
  constructor(
    private readonly activityRepo = new ActivityRepository(),
    private readonly participantRepo = new ActivityParticipantRepository(),
    private readonly contactRepo = new ContactRepository(),
    private readonly companyRepo = new CompanyRepository(),
    private readonly dealRepo = new DealRepository(),
    private readonly leadSyncService = new LeadSyncService()
  ) {}

  /**
   * Create activity with business logic and auto-participant assignment
   */
  async createActivity(data: CreateActivityInput): Promise<Activity> {
    // 1. Validate input
    this.validateActivityInput(data);

    // 2. Verify primary entity exists
    await this.verifyEntityExists(data.primary_entity_type, data.primary_entity_id);

    // 3. Prepare activity data
    const activityData: CreateActivityData = {
      activity_type: data.activity_type,
      primary_entity_type: data.primary_entity_type,
      primary_entity_id: data.primary_entity_id,
      user_id: data.user_id,
      title: data.title,
      content: data.content,
      data: data.data ? JSON.stringify(data.data) : undefined,
      parent_id: data.parent_id,
      status: data.status || 'completed',
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : undefined
    };

    // 4. Auto-assign participants based on primary entity
    const autoParticipants = await this.generateAutoParticipants(
      data.primary_entity_type, 
      data.primary_entity_id
    );

    // 5. Merge with explicitly provided participants
    const allParticipants = [
      ...autoParticipants,
      ...(data.participants || [])
    ];

    // 6. Remove duplicates
    const uniqueParticipants = this.deduplicateParticipants(allParticipants);

    // 7. Create activity with participants
    const activity = await this.activityRepo.create(activityData, uniqueParticipants);

    // 8. Trigger activity propagation if needed
    await this.leadSyncService.propagateActivity(activity);

    // 9. Return activity with participants
    return this.getActivityById(activity.id, { includeParticipants: true, includeUser: true });
  }

  /**
   * Get activities for a specific entity
   */
  async getActivitiesForEntity(
    entityType: EntityType, 
    entityId: number, 
    options: ActivityQueryOptions = {}
  ): Promise<Activity[]> {
    // Verify entity exists
    await this.verifyEntityExists(entityType, entityId);

    // Get activities with threading information
    const activities = await this.activityRepo.findByEntity(entityType, entityId, {
      ...options,
      includeUser: true,
      includeParticipants: true
    });

    // Sort by created_at desc (already done in repository)
    return activities;
  }

  /**
   * Get activity by ID with options
   */
  async getActivityById(id: number, options: { includeParticipants?: boolean, includeUser?: boolean } = {}): Promise<Activity> {
    const activity = this.activityRepo.findById(id, options);
    if (!activity) {
      throw new Error(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  /**
   * Update activity
   */
  async updateActivity(id: number, data: UpdateActivityInput): Promise<Activity> {
    // Validate update data
    if (data.activity_type) {
      this.validateActivityType(data.activity_type);
    }

    const updated = this.activityRepo.update(id, data);
    if (!updated) {
      throw new Error(`Activity with ID ${id} not found or could not be updated`);
    }

    return updated;
  }

  /**
   * Delete activity
   */
  async deleteActivity(id: number): Promise<boolean> {
    return this.activityRepo.delete(id);
  }

  /**
   * Create a note activity (convenience method)
   */
  async createNote(
    entityType: EntityType, 
    entityId: number, 
    content: string, 
    userId: number,
    title?: string
  ): Promise<Activity> {
    return this.createActivity({
      activity_type: 'note',
      primary_entity_type: entityType,
      primary_entity_id: entityId,
      user_id: userId,
      title: title || 'Note',
      content,
      status: 'completed'
    });
  }

  /**
   * Log a call activity (convenience method)
   */
  async logCall(
    entityType: EntityType, 
    entityId: number, 
    callData: CallData, 
    userId: number
  ): Promise<Activity> {
    const title = `Call - ${callData.outcome || 'Completed'}`;
    const content = callData.notes || 'Call completed';

    return this.createActivity({
      activity_type: 'call',
      primary_entity_type: entityType,
      primary_entity_id: entityId,
      user_id: userId,
      title,
      content,
      data: {
        duration: callData.duration,
        outcome: callData.outcome,
        followUpRequired: callData.followUpRequired,
        sentiment: callData.sentiment
      },
      status: 'completed'
    });
  }

  /**
   * Schedule a follow-up activity
   */
  async scheduleFollowUp(
    parentActivityId: number, 
    scheduledAt: Date, 
    content: string,
    userId: number,
    activityType: ActivityType = 'task'
  ): Promise<Activity> {
    // Get parent activity to inherit entity context
    const parentActivity = await this.getActivityById(parentActivityId);

    return this.createActivity({
      activity_type: activityType,
      primary_entity_type: parentActivity.primary_entity_type,
      primary_entity_id: parentActivity.primary_entity_id,
      user_id: userId,
      title: `Follow-up: ${parentActivity.title || 'Previous Activity'}`,
      content,
      parent_id: parentActivityId,
      status: 'scheduled',
      scheduled_at: scheduledAt
    });
  }

  /**
   * Get activity thread (parent + children)
   */
  async getActivityThread(activityId: number): Promise<Activity[]> {
    return this.activityRepo.findThread(activityId);
  }

  /**
   * Get scheduled activities for entity
   */
  async getScheduledActivities(entityType?: EntityType, entityId?: number): Promise<Activity[]> {
    return this.activityRepo.findScheduled(entityType, entityId);
  }

  /**
   * Generate auto-participants based on entity relationships
   */
  private async generateAutoParticipants(
    entityType: EntityType, 
    entityId: number
  ): Promise<Array<{entity_type: EntityType, entity_id: number, role: string}>> {
    const participants: Array<{entity_type: EntityType, entity_id: number, role: string}> = [];

    switch (entityType) {
      case 'contact':
        // Contact page activity → Add contact as primary participant
        participants.push({
          entity_type: 'contact',
          entity_id: entityId,
          role: 'primary'
        });

        // Also add associated company if it exists
        const contact = this.contactRepo.findById(entityId);
        if (contact && contact.company_id) {
          participants.push({
            entity_type: 'company',
            entity_id: contact.company_id,
            role: 'participant'
          });
        }
        break;

      case 'company':
        // Company page activity → Add company + all related contacts as participants
        participants.push({
          entity_type: 'company',
          entity_id: entityId,
          role: 'primary'
        });

        // Add all contacts from this company
        const companyContacts = this.contactRepo.findByCompany(entityId);
        for (const contact of companyContacts) {
          participants.push({
            entity_type: 'contact',
            entity_id: contact.id,
            role: 'participant'
          });
        }
        break;

      case 'deal':
        // Deal page activity → Add deal + associated company + related contacts as participants
        participants.push({
          entity_type: 'deal',
          entity_id: entityId,
          role: 'primary'
        });

        // Get deal details to find associated company and contact
        const dealData = await db
          .select({
            deal_id: deals.id,
            company_id: deals.company_id,
            contact_id: deals.contact_id
          })
          .from(deals)
          .where(eq(deals.id, entityId))
          .limit(1)
          .all();

        if (dealData.length > 0) {
          const deal = dealData[0];

          // Add associated company
          if (deal.company_id) {
            participants.push({
              entity_type: 'company',
              entity_id: deal.company_id,
              role: 'participant'
            });

            // Add all contacts from the company
            const dealCompanyContacts = this.contactRepo.findByCompany(deal.company_id);
            for (const contact of dealCompanyContacts) {
              participants.push({
                entity_type: 'contact',
                entity_id: contact.id,
                role: 'participant'
              });
            }
          }

          // Add primary contact if different from company contacts
          if (deal.contact_id && !participants.some(p => p.entity_type === 'contact' && p.entity_id === deal.contact_id)) {
            participants.push({
              entity_type: 'contact',
              entity_id: deal.contact_id,
              role: 'participant'
            });
          }
        }
        break;
    }

    return participants;
  }

  /**
   * Remove duplicate participants
   */
  private deduplicateParticipants(
    participants: Array<{entity_type: EntityType, entity_id: number, role?: string}>
  ): Array<{entity_type: EntityType, entity_id: number, role: string}> {
    const seen = new Set<string>();
    const unique: Array<{entity_type: EntityType, entity_id: number, role: string}> = [];

    for (const participant of participants) {
      const key = `${participant.entity_type}:${participant.entity_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          entity_type: participant.entity_type,
          entity_id: participant.entity_id,
          role: participant.role || 'participant'
        });
      }
    }

    return unique;
  }

  /**
   * Validate activity input
   */
  private validateActivityInput(data: CreateActivityInput): void {
    if (!data.activity_type) {
      throw new Error('Activity type is required');
    }

    if (!data.primary_entity_type) {
      throw new Error('Primary entity type is required');
    }

    if (!data.primary_entity_id) {
      throw new Error('Primary entity ID is required');
    }

    if (!data.user_id) {
      throw new Error('User ID is required');
    }

    this.validateActivityType(data.activity_type);
    this.validateEntityType(data.primary_entity_type);

    // Validate scheduled_at for scheduled activities
    if (data.status === 'scheduled' && !data.scheduled_at) {
      throw new Error('Scheduled activities must have a scheduled_at date');
    }
  }

  /**
   * Validate activity type
   */
  private validateActivityType(type: ActivityType): void {
    const validTypes: ActivityType[] = ['call', 'email', 'note', 'meeting', 'task'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid activity type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Validate entity type
   */
  private validateEntityType(type: EntityType): void {
    const validTypes: EntityType[] = ['contact', 'company', 'deal'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid entity type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Verify that an entity exists in the database
   */
  private async verifyEntityExists(entityType: EntityType, entityId: number): Promise<void> {
    let exists = false;

    switch (entityType) {
      case 'contact':
        exists = !!this.contactRepo.findById(entityId);
        break;
      case 'company':
        exists = !!this.companyRepo.findById(entityId);
        break;
      case 'deal':
        const dealResult = await db
          .select({ id: deals.id })
          .from(deals)
          .where(eq(deals.id, entityId))
          .limit(1)
          .all();
        exists = dealResult.length > 0;
        break;
    }

    if (!exists) {
      throw new Error(`${entityType} with ID ${entityId} not found`);
    }
  }

  /**
   * Add participant to existing activity
   */
  async addParticipant(
    activityId: number, 
    entityType: EntityType, 
    entityId: number, 
    role = 'participant'
  ): Promise<void> {
    // Verify activity exists
    await this.getActivityById(activityId);

    // Verify entity exists
    await this.verifyEntityExists(entityType, entityId);

    // Add participant
    this.participantRepo.addParticipant(activityId, entityType, entityId, role);
  }

  /**
   * Remove participant from activity
   */
  async removeParticipant(
    activityId: number, 
    entityType: EntityType, 
    entityId: number
  ): Promise<boolean> {
    return this.participantRepo.removeParticipant(activityId, entityType, entityId);
  }

  /**
   * Get all activities with optional filtering
   */
  async getAllActivities(options: ActivityQueryOptions = {}): Promise<Activity[]> {
    return this.activityRepo.findAll({
      ...options,
      includeUser: true,
      includeParticipants: options.includeParticipants || false
    });
  }

  /**
   * Get activity statistics for an entity
   */
  async getActivityStats(entityType: EntityType, entityId: number): Promise<{
    total: number;
    byType: Record<ActivityType, number>;
    recent: Activity[];
  }> {
    const activities = await this.getActivitiesForEntity(entityType, entityId);
    
    const stats = {
      total: activities.length,
      byType: {
        call: 0,
        email: 0,
        note: 0,
        meeting: 0,
        task: 0
      } as Record<ActivityType, number>,
      recent: activities.slice(0, 5) // Most recent 5
    };

    for (const activity of activities) {
      stats.byType[activity.activity_type]++;
    }

    return stats;
  }
}