export type ActivityType = 'call' | 'email' | 'note' | 'meeting' | 'task';
export type EntityType = 'contact' | 'company' | 'deal';
export type ActivityStatus = 'completed' | 'scheduled' | 'pending' | 'cancelled';
export type ParticipantRole = 'primary' | 'participant' | 'mentioned';

export interface Activity {
  id: number;
  activity_type: ActivityType;
  primary_entity_type: EntityType;
  primary_entity_id: number;
  user_id: number;
  title?: string | null;
  content?: string | null;
  data?: Record<string, any> | null;
  parent_id?: number | null;
  status: ActivityStatus;
  scheduled_at?: Date | string | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
  
  // Relations (populated when needed)
  user?: User;
  participants?: ActivityParticipant[];
  parent?: Activity;
  children?: Activity[];
}

export interface ActivityParticipant {
  id: number;
  activity_id: number;
  entity_type: EntityType;
  entity_id: number;
  role: ParticipantRole;
  created_at: Date | string;
}

// Input types for creating activities
export interface CreateActivityInput {
  activity_type: ActivityType;
  primary_entity_type: EntityType;
  primary_entity_id: number;
  user_id: number;
  title?: string;
  content?: string;
  data?: Record<string, any>;
  parent_id?: number;
  status?: ActivityStatus;
  scheduled_at?: Date | string;
  participants?: CreateParticipantInput[];
}

export interface CreateParticipantInput {
  entity_type: EntityType;
  entity_id: number;
  role?: ParticipantRole;
}

// Update types
export interface UpdateActivityInput {
  activity_type?: ActivityType;
  title?: string;
  content?: string;
  data?: Record<string, any>;
  status?: ActivityStatus;
  scheduled_at?: Date | string | null;
}

// Query types
export interface ActivityQueryOptions {
  entityType?: EntityType;
  entityId?: number;
  activityType?: ActivityType;
  status?: ActivityStatus;
  searchQuery?: string; // Search parameter for title and content
  limit?: number;
  offset?: number;
  includeParticipants?: boolean;
  includeUser?: boolean;
  includeThread?: boolean;
}

// User interface (reusing existing pattern)
export interface User {
  id: number;
  username: string;
  email: string;
  role?: string | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
}

// Activity creation data for repository
export interface CreateActivityData {
  activity_type: ActivityType;
  primary_entity_type: EntityType;
  primary_entity_id: number;
  user_id: number;
  title?: string;
  content?: string;
  data?: string; // JSON string for database storage
  parent_id?: number;
  status?: ActivityStatus;
  scheduled_at?: string;
}

// Participant creation data for repository
export interface CreateParticipantData {
  activity_id: number;
  entity_type: EntityType;
  entity_id: number;
  role?: ParticipantRole;
}

// Activity with populated entities for display
export interface ActivityWithEntities extends Activity {
  participants: (ActivityParticipant & {
    entity?: {
      id: number;
      name: string;
      type?: string;
    };
  })[];
}