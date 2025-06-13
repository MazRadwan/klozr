// Entity type management utilities for server-side use
// Safe utilities extracted from entityTypeUtils.ts

export const ENTITY_TYPES = [
  'lead',
  'customer', 
  'partner'
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

export class EntityTypeUtilityService {
  /**
   * Gets the color classes for entity type badges
   */
  static getEntityTypeColor(type?: string): string {
    const colors = {
      'lead': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      'customer': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      'partner': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
  }

  /**
   * Gets entity type for a contact - simplified (no inheritance)
   */
  static getContactEntityType(contact: {
    type?: string | null;
  }): { type: string | null } {
    return {
      type: contact.type || null
    };
  }

  /**
   * Gets entity type for a company - simplified (no inheritance)
   */
  static getCompanyEntityType(company: {
    type?: string | null;
  }): { type: string | null } {
    return {
      type: company.type || null
    };
  }

  /**
   * Determines if lead status should be shown based on entity type
   */
  static shouldShowLeadStatus(type?: string | null): boolean {
    return type === 'lead';
  }

  /**
   * Gets display text for entity types
   */
  static getEntityTypeDisplayText(type?: string | null): string {
    if (!type) return 'No Type';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Validates entity type value
   */
  static isValidEntityType(type: string): type is EntityType {
    return ENTITY_TYPES.includes(type as EntityType);
  }

  /**
   * Determines if an entity type transition would clear lead fields
   */
  static shouldClearLeadFields(fromType?: string | null, toType?: string | null): boolean {
    // Lead fields should be cleared when transitioning from 'lead' to any other type
    return fromType === 'lead' && toType !== 'lead';
  }
}