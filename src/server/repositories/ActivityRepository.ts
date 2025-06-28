import { db } from '@/lib/db';
import { activities, activity_participants, users, contacts, companies, deals } from '@/lib/schema';
import { eq, and, or, inArray, desc, asc, like, SQL } from 'drizzle-orm';
import { 
  Activity, 
  CreateActivityData, 
  UpdateActivityInput, 
  ActivityType, 
  EntityType,
  ActivityQueryOptions,
  ActivityWithEntities
} from '@/lib/types/activities';

export class ActivityRepository {
  constructor(private readonly database = db) {}

  /**
   * Create a new activity with optional participants
   */
  async create(data: CreateActivityData, participantData?: Array<{entity_type: EntityType, entity_id: number, role?: string}>): Promise<Activity> {
    // Insert activity
    const result = this.database
      .insert(activities)
      .values({
        ...data,
        data: data.data ? JSON.stringify(data.data) : null,
        updated_at: new Date().toISOString()
      })
      .run();

    const activityId = Number(result.lastInsertRowid);

    // Insert participants if provided
    if (participantData && participantData.length > 0) {
      this.database
        .insert(activity_participants)
        .values(participantData.map(p => ({
          activity_id: activityId,
          entity_type: p.entity_type,
          entity_id: p.entity_id,
          role: p.role || 'participant'
        })))
        .run();
    }

    // Return the created activity
    const created = this.findById(activityId);
    if (!created) {
      throw new Error('Failed to create activity');
    }
    return created;
  }

  /**
   * Find activity by ID with optional includes
   */
  findById(id: number, options: { includeUser?: boolean, includeParticipants?: boolean } = {}): Activity | null {
    const baseQuery = options.includeUser 
      ? this.database
          .select({
            id: activities.id,
            activity_type: activities.activity_type,
            primary_entity_type: activities.primary_entity_type,
            primary_entity_id: activities.primary_entity_id,
            user_id: activities.user_id,
            title: activities.title,
            content: activities.content,
            data: activities.data,
            parent_id: activities.parent_id,
            status: activities.status,
            scheduled_at: activities.scheduled_at,
            created_at: activities.created_at,
            updated_at: activities.updated_at,
            // User information
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              role: users.role,
              created_at: users.created_at,
              updated_at: users.updated_at
            }
          })
          .from(activities)
          .leftJoin(users, eq(activities.user_id, users.id))
      : this.database.select().from(activities);

    const result = baseQuery
      .where(eq(activities.id, id))
      .limit(1)
      .all();

    if (result.length === 0) return null;

    const activity = result[0] as Activity;

    // Parse JSON data if it exists
    if (activity.data && typeof activity.data === 'string') {
      try {
        activity.data = JSON.parse(activity.data);
      } catch {
        activity.data = null;
      }
    }

    // Include participants if requested
    if (options.includeParticipants) {
      activity.participants = this.findParticipantsByActivityId(id);
    }

    return activity;
  }

  /**
   * Update activity by ID
   */
  update(id: number, data: UpdateActivityInput): Activity | null {
    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString()
    };

    // Stringify data if it's an object
    if (updateData.data && typeof updateData.data === 'object') {
      updateData.data = JSON.stringify(updateData.data);
    }

    const result = this.database
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .run();

    if (result.changes === 0) {
      return null;
    }

    // Return the updated activity
    return this.findById(id);
  }

  /**
   * Delete activity by ID
   */
  delete(id: number): boolean {
    // Delete participants first (cascade)
    this.database
      .delete(activity_participants)
      .where(eq(activity_participants.activity_id, id))
      .run();

    // Delete activity
    const result = this.database
      .delete(activities)
      .where(eq(activities.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Find activities by entity (contact, company, or deal)
   */
  findByEntity(entityType: EntityType, entityId: number, options: ActivityQueryOptions = {}): Activity[] {
    return this.findByEntities([{ type: entityType, id: entityId }], options);
  }

  /**
   * Find activities by multiple entities
   */
  findByEntities(entities: Array<{type: EntityType, id: number}>, options: ActivityQueryOptions = {}): Activity[] {
    if (entities.length === 0) return [];

    // Build participant conditions
    const participantConditions = entities.map(entity => 
      and(
        eq(activity_participants.entity_type, entity.type),
        eq(activity_participants.entity_id, entity.id)
      )
    );

    // Get activity IDs that have participants matching our entities
    const participantResults = this.database
      .select({ activity_id: activity_participants.activity_id })
      .from(activity_participants)
      .where(or(...participantConditions))
      .all();

    if (participantResults.length === 0) return [];

    const activityIds = Array.from(new Set(participantResults.map(p => p.activity_id)));

    // Build the main query
    let query = options.includeUser 
      ? this.database
          .select({
            id: activities.id,
            activity_type: activities.activity_type,
            primary_entity_type: activities.primary_entity_type,
            primary_entity_id: activities.primary_entity_id,
            user_id: activities.user_id,
            title: activities.title,
            content: activities.content,
            data: activities.data,
            parent_id: activities.parent_id,
            status: activities.status,
            scheduled_at: activities.scheduled_at,
            created_at: activities.created_at,
            updated_at: activities.updated_at,
            // User information
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              role: users.role,
              created_at: users.created_at,
              updated_at: users.updated_at
            }
          })
          .from(activities)
          .leftJoin(users, eq(activities.user_id, users.id))
      : this.database.select().from(activities);

    // Add filters
    let whereConditions = [inArray(activities.id, activityIds)];

    if (options.activityType) {
      if (Array.isArray(options.activityType)) {
        if (options.activityType.length > 0) {
          whereConditions.push(inArray(activities.activity_type, options.activityType));
        }
      } else {
        whereConditions.push(eq(activities.activity_type, options.activityType));
      }
    }

    if (options.status) {
      whereConditions.push(eq(activities.status, options.status));
    }

    // Add search condition for title and content
    if (options.searchQuery && options.searchQuery.trim()) {
      const searchTerm = `%${options.searchQuery.trim()}%`;
      whereConditions.push(
        or(
          like(activities.title, searchTerm),
          like(activities.content, searchTerm)
        )
      );
    }

    query = query.where(and(...whereConditions));

    // Add ordering based on options
    const sortField = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    
    console.log('ActivityRepository findByEntities sorting:', { sortField, sortOrder, activityType: options.activityType });
    
    // Map sort field to actual column reference
    const getOrderByColumn = (field: string) => {
      switch (field) {
        case 'created_at': return activities.created_at;
        case 'title': return activities.title;
        case 'activity_type': return activities.activity_type;
        case 'status': return activities.status;
        default: return activities.created_at;
      }
    };
    
    const orderColumn = getOrderByColumn(sortField);
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(orderColumn));
    } else {
      query = query.orderBy(desc(orderColumn));
    }

    // Add limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const results = query.all() as Activity[];

    // Process results
    return results.map(activity => {
      // Parse JSON data if it exists
      if (activity.data && typeof activity.data === 'string') {
        try {
          activity.data = JSON.parse(activity.data);
        } catch {
          activity.data = null;
        }
      }

      // Include participants if requested
      if (options.includeParticipants) {
        activity.participants = this.findParticipantsByActivityId(activity.id);
      }

      return activity;
    });
  }

  /**
   * Find activities by parent ID (threading)
   */
  findByParent(parentId: number): Activity[] {
    const results = this.database
      .select()
      .from(activities)
      .where(eq(activities.parent_id, parentId))
      .orderBy(asc(activities.created_at))
      .all() as Activity[];

    return results.map(activity => {
      // Parse JSON data if it exists
      if (activity.data && typeof activity.data === 'string') {
        try {
          activity.data = JSON.parse(activity.data);
        } catch {
          activity.data = null;
        }
      }
      return activity;
    });
  }

  /**
   * Find complete thread for an activity (parent + children)
   */
  findThread(activityId: number): Activity[] {
    const activity = this.findById(activityId);
    if (!activity) return [];

    // If this activity has a parent, start from the parent
    const rootId = activity.parent_id || activityId;
    
    // Get root activity
    const root = this.findById(rootId);
    if (!root) return [];

    // Get all children
    const children = this.findByParent(rootId);

    return [root, ...children];
  }

  /**
   * Find activities by activity type
   */
  findByActivityType(activityType: ActivityType, entityType?: EntityType, entityId?: number): Activity[] {
    let query = this.database
      .select()
      .from(activities)
      .where(eq(activities.activity_type, activityType));

    // If entity filters are provided, join with participants
    if (entityType && entityId) {
      const participantResults = this.database
        .select({ activity_id: activity_participants.activity_id })
        .from(activity_participants)
        .where(and(
          eq(activity_participants.entity_type, entityType),
          eq(activity_participants.entity_id, entityId)
        ))
        .all();

      if (participantResults.length === 0) return [];

      const activityIds = participantResults.map(p => p.activity_id);
      query = query.where(and(
        eq(activities.activity_type, activityType),
        inArray(activities.id, activityIds)
      ));
    }

    const results = query
      .orderBy(desc(activities.created_at))
      .all() as Activity[];

    return results.map(activity => {
      // Parse JSON data if it exists
      if (activity.data && typeof activity.data === 'string') {
        try {
          activity.data = JSON.parse(activity.data);
        } catch {
          activity.data = null;
        }
      }
      return activity;
    });
  }

  /**
   * Find scheduled activities
   */
  findScheduled(entityType?: EntityType, entityId?: number): Activity[] {
    let query = this.database
      .select()
      .from(activities)
      .where(eq(activities.status, 'scheduled'));

    // If entity filters are provided, join with participants
    if (entityType && entityId) {
      const participantResults = this.database
        .select({ activity_id: activity_participants.activity_id })
        .from(activity_participants)
        .where(and(
          eq(activity_participants.entity_type, entityType),
          eq(activity_participants.entity_id, entityId)
        ))
        .all();

      if (participantResults.length === 0) return [];

      const activityIds = participantResults.map(p => p.activity_id);
      query = query.where(and(
        eq(activities.status, 'scheduled'),
        inArray(activities.id, activityIds)
      ));
    }

    const results = query
      .orderBy(asc(activities.scheduled_at))
      .all() as Activity[];

    return results.map(activity => {
      // Parse JSON data if it exists
      if (activity.data && typeof activity.data === 'string') {
        try {
          activity.data = JSON.parse(activity.data);
        } catch {
          activity.data = null;
        }
      }
      return activity;
    });
  }

  /**
   * Helper method to find participants for an activity
   */
  private findParticipantsByActivityId(activityId: number) {
    return this.database
      .select()
      .from(activity_participants)
      .where(eq(activity_participants.activity_id, activityId))
      .all();
  }

  /**
   * Find all activities with optional user information
   */
  findAll(options: ActivityQueryOptions = {}): Activity[] {
    let query = options.includeUser 
      ? this.database
          .select({
            id: activities.id,
            activity_type: activities.activity_type,
            primary_entity_type: activities.primary_entity_type,
            primary_entity_id: activities.primary_entity_id,
            user_id: activities.user_id,
            title: activities.title,
            content: activities.content,
            data: activities.data,
            parent_id: activities.parent_id,
            status: activities.status,
            scheduled_at: activities.scheduled_at,
            created_at: activities.created_at,
            updated_at: activities.updated_at,
            // User information
            user: {
              id: users.id,
              username: users.username,
              email: users.email,
              role: users.role,
              created_at: users.created_at,
              updated_at: users.updated_at
            }
          })
          .from(activities)
          .leftJoin(users, eq(activities.user_id, users.id))
      : this.database.select().from(activities);

    // Add filters
    let whereConditions = [];

    if (options.activityType) {
      if (Array.isArray(options.activityType)) {
        if (options.activityType.length > 0) {
          whereConditions.push(inArray(activities.activity_type, options.activityType));
        }
      } else {
        whereConditions.push(eq(activities.activity_type, options.activityType));
      }
    }

    if (options.status) {
      whereConditions.push(eq(activities.status, options.status));
    }

    // Add search condition for title and content
    if (options.searchQuery && options.searchQuery.trim()) {
      const searchTerm = `%${options.searchQuery.trim()}%`;
      whereConditions.push(
        or(
          like(activities.title, searchTerm),
          like(activities.content, searchTerm)
        )
      );
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Add ordering based on options
    const sortField = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    
    // Map sort field to actual column reference
    const getOrderByColumn = (field: string) => {
      switch (field) {
        case 'created_at': return activities.created_at;
        case 'title': return activities.title;
        case 'activity_type': return activities.activity_type;
        case 'status': return activities.status;
        default: return activities.created_at;
      }
    };
    
    const orderColumn = getOrderByColumn(sortField);
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(orderColumn));
    } else {
      query = query.orderBy(desc(orderColumn));
    }

    // Add limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const results = query.all() as Activity[];

    return results.map(activity => {
      // Parse JSON data if it exists
      if (activity.data && typeof activity.data === 'string') {
        try {
          activity.data = JSON.parse(activity.data);
        } catch {
          activity.data = null;
        }
      }

      // Include participants if requested
      if (options.includeParticipants) {
        activity.participants = this.findParticipantsByActivityId(activity.id);
      }

      return activity;
    });
  }
}