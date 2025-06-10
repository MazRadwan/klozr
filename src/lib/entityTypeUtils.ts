// Entity type management utilities
// Simplified for bidirectional sync approach

export const ENTITY_TYPES = [
  'lead',
  'customer', 
  'partner'
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

/**
 * Gets the color classes for entity type badges
 */
export function getEntityTypeColor(type?: string): string {
  const colors = {
    'lead': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    'customer': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
    'partner': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
}

/**
 * Gets entity type for a contact - simplified (no inheritance)
 * In bidirectional sync, contact.type is always the actual value
 */
export function getContactEntityType(contact: {
  type?: string | null;
}): { type: string | null } {
  return {
    type: contact.type || null
  };
}

/**
 * Gets entity type for a company - simplified (no inheritance)
 */
export function getCompanyEntityType(company: {
  type?: string | null;
}): { type: string | null } {
  return {
    type: company.type || null
  };
}

/**
 * Updates contact entity type with bidirectional sync
 */
export async function updateContactEntityType(
  contactId: number,
  newType: EntityType | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/contacts/${contactId}/type`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating contact entity type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update entity type'
    };
  }
}

/**
 * Updates company entity type with bidirectional sync
 */
export async function updateCompanyEntityType(
  companyId: number,
  newType: EntityType | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/companies/${companyId}/type`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating company entity type:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update entity type'
    };
  }
}

/**
 * Conversion workflows
 */
export async function convertLeadToCustomer(
  entityType: 'contact' | 'company',
  entityId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (entityType === 'contact') {
      return await updateContactEntityType(entityId, 'customer');
    } else {
      return await updateCompanyEntityType(entityId, 'customer');
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to customer'
    };
  }
}

/**
 * Determines if lead status should be shown based on entity type
 */
export function shouldShowLeadStatus(type?: string | null): boolean {
  return type === 'lead';
}

/**
 * Gets display text for entity types
 */
export function getEntityTypeDisplayText(type?: string | null): string {
  if (!type) return 'No Type';
  return type.charAt(0).toUpperCase() + type.slice(1);
}