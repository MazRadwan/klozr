import { db } from '@/lib/db';
import { activity_participants, contacts, companies, deals } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  ActivityParticipant, 
  CreateParticipantData, 
  EntityType 
} from '@/lib/types/activities';

export class ActivityParticipantRepository {
  constructor(private readonly database = db) {}

  /**
   * Create a new activity participant
   */
  create(data: CreateParticipantData): ActivityParticipant {
    const result = this.database
      .insert(activity_participants)
      .values(data)
      .run();

    const participantId = Number(result.lastInsertRowid);
    
    const created = this.findById(participantId);
    if (!created) {
      throw new Error('Failed to create activity participant');
    }
    return created;
  }

  /**
   * Create multiple participants for an activity
   */
  createMultiple(activityId: number, participants: Array<{entity_type: EntityType, entity_id: number, role?: string}>): ActivityParticipant[] {
    if (participants.length === 0) return [];

    const participantData = participants.map(p => ({
      activity_id: activityId,
      entity_type: p.entity_type,
      entity_id: p.entity_id,
      role: p.role || 'participant'
    }));

    this.database
      .insert(activity_participants)
      .values(participantData)
      .run();

    // Return all participants for this activity
    return this.findByActivityId(activityId);
  }

  /**
   * Find participant by ID
   */
  findById(id: number): ActivityParticipant | null {
    const result = this.database
      .select()
      .from(activity_participants)
      .where(eq(activity_participants.id, id))
      .limit(1)
      .all();

    return result.length > 0 ? result[0] as ActivityParticipant : null;
  }

  /**
   * Find all participants for an activity
   */
  findByActivityId(activityId: number): ActivityParticipant[] {
    return this.database
      .select()
      .from(activity_participants)
      .where(eq(activity_participants.activity_id, activityId))
      .all() as ActivityParticipant[];
  }

  /**
   * Find all participants for multiple activities
   */
  findByActivityIds(activityIds: number[]): Record<number, ActivityParticipant[]> {
    if (activityIds.length === 0) return {};

    const results = this.database
      .select()
      .from(activity_participants)
      .where(inArray(activity_participants.activity_id, activityIds))
      .all() as ActivityParticipant[];

    // Group by activity_id
    const grouped: Record<number, ActivityParticipant[]> = {};
    for (const participant of results) {
      if (!grouped[participant.activity_id]) {
        grouped[participant.activity_id] = [];
      }
      grouped[participant.activity_id].push(participant);
    }

    return grouped;
  }

  /**
   * Find participants by entity (all activities this entity participates in)
   */
  findByEntity(entityType: EntityType, entityId: number): ActivityParticipant[] {
    return this.database
      .select()
      .from(activity_participants)
      .where(and(
        eq(activity_participants.entity_type, entityType),
        eq(activity_participants.entity_id, entityId)
      ))
      .all() as ActivityParticipant[];
  }

  /**
   * Find participants with entity details populated
   */
  findByActivityIdWithEntities(activityId: number): Array<ActivityParticipant & { entity?: any }> {
    const participants = this.findByActivityId(activityId);
    
    return participants.map(participant => {
      let entity = null;

      try {
        // Fetch entity details based on type
        switch (participant.entity_type) {
          case 'contact':
            const contact = this.database
              .select({
                id: contacts.id,
                name: contacts.first_name, // We'll concatenate later
                last_name: contacts.last_name,
                type: contacts.type
              })
              .from(contacts)
              .where(eq(contacts.id, participant.entity_id))
              .limit(1)
              .all()[0];
            
            if (contact) {
              entity = {
                id: contact.id,
                name: `${contact.name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact',
                type: contact.type
              };
            }
            break;

          case 'company':
            const company = this.database
              .select({
                id: companies.id,
                name: companies.name,
                type: companies.type
              })
              .from(companies)
              .where(eq(companies.id, participant.entity_id))
              .limit(1)
              .all()[0];
            
            if (company) {
              entity = {
                id: company.id,
                name: company.name || 'Unnamed Company',
                type: company.type
              };
            }
            break;

          case 'deal':
            const deal = this.database
              .select({
                id: deals.id,
                name: deals.title,
                type: 'deal' // Deals don't have a type field
              })
              .from(deals)
              .where(eq(deals.id, participant.entity_id))
              .limit(1)
              .all()[0];
            
            if (deal) {
              entity = {
                id: deal.id,
                name: deal.name || 'Unnamed Deal',
                type: 'deal'
              };
            }
            break;
        }
      } catch (error) {
        // If entity doesn't exist or there's an error, entity remains null
        console.warn(`Failed to fetch entity ${participant.entity_type}:${participant.entity_id}`, error);
      }

      return {
        ...participant,
        entity
      };
    });
  }

  /**
   * Update participant role
   */
  updateRole(id: number, role: string): ActivityParticipant | null {
    const result = this.database
      .update(activity_participants)
      .set({ role })
      .where(eq(activity_participants.id, id))
      .run();

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Delete participant by ID
   */
  delete(id: number): boolean {
    const result = this.database
      .delete(activity_participants)
      .where(eq(activity_participants.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Delete all participants for an activity
   */
  deleteByActivityId(activityId: number): boolean {
    const result = this.database
      .delete(activity_participants)
      .where(eq(activity_participants.activity_id, activityId))
      .run();

    return result.changes > 0;
  }

  /**
   * Delete participants by entity (when entity is deleted)
   */
  deleteByEntity(entityType: EntityType, entityId: number): boolean {
    const result = this.database
      .delete(activity_participants)
      .where(and(
        eq(activity_participants.entity_type, entityType),
        eq(activity_participants.entity_id, entityId)
      ))
      .run();

    return result.changes > 0;
  }

  /**
   * Check if entity is participant in activity
   */
  isParticipant(activityId: number, entityType: EntityType, entityId: number): boolean {
    const result = this.database
      .select()
      .from(activity_participants)
      .where(and(
        eq(activity_participants.activity_id, activityId),
        eq(activity_participants.entity_type, entityType),
        eq(activity_participants.entity_id, entityId)
      ))
      .limit(1)
      .all();

    return result.length > 0;
  }

  /**
   * Add participant to activity (if not already exists)
   */
  addParticipant(activityId: number, entityType: EntityType, entityId: number, role = 'participant'): ActivityParticipant | null {
    // Check if already exists
    if (this.isParticipant(activityId, entityType, entityId)) {
      return null; // Already exists
    }

    return this.create({
      activity_id: activityId,
      entity_type: entityType,
      entity_id: entityId,
      role
    });
  }

  /**
   * Remove participant from activity
   */
  removeParticipant(activityId: number, entityType: EntityType, entityId: number): boolean {
    const result = this.database
      .delete(activity_participants)
      .where(and(
        eq(activity_participants.activity_id, activityId),
        eq(activity_participants.entity_type, entityType),
        eq(activity_participants.entity_id, entityId)
      ))
      .run();

    return result.changes > 0;
  }

  /**
   * Get activity IDs for an entity (for finding all activities an entity participates in)
   */
  getActivityIdsForEntity(entityType: EntityType, entityId: number): number[] {
    const results = this.database
      .select({ activity_id: activity_participants.activity_id })
      .from(activity_participants)
      .where(and(
        eq(activity_participants.entity_type, entityType),
        eq(activity_participants.entity_id, entityId)
      ))
      .all();

    return results.map(r => r.activity_id);
  }

  /**
   * Get statistics about participants for an activity
   */
  getParticipantStats(activityId: number): { total: number, byType: Record<EntityType, number>, byRole: Record<string, number> } {
    const participants = this.findByActivityId(activityId);
    
    const stats = {
      total: participants.length,
      byType: { contact: 0, company: 0, deal: 0 } as Record<EntityType, number>,
      byRole: {} as Record<string, number>
    };

    for (const participant of participants) {
      // Count by type
      stats.byType[participant.entity_type]++;
      
      // Count by role
      const role = participant.role || 'participant';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    }

    return stats;
  }
}