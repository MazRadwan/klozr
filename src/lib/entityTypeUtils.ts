// Entity type management utilities
// Handles the lifecycle-based approach for contact/company classification

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
 * Determines effective entity type for a contact
 * Implements the hybrid business logic (same pattern as lead status)
 */
export function getEffectiveEntityType(contact: {
  type?: string | null;
  company_id?: number | null;
  company?: { type?: string | null } | null;
}): { type: string | null; source: 'individual' | 'company' | null; inherited: boolean } {
  // If contact has no company, use individual type
  if (!contact.company_id || !contact.company) {
    return {
      type: contact.type || null,
      source: contact.type ? 'individual' : null,
      inherited: false
    };
  }

  const companyType = contact.company.type;
  const individualType = contact.type;

  // If both contact and company have types, and they match, show as inherited
  // If contact has a type that differs from company, show as individual
  // If only company has type, show as inherited
  // If only contact has type, show as individual
  
  if (companyType && individualType) {
    if (companyType === individualType) {
      // When they match, assume it's inherited (since we auto-sync)
      return {
        type: companyType,
        source: 'company',
        inherited: true
      };
    } else {
      // When they differ, contact has been individually set
      return {
        type: individualType,
        source: 'individual',
        inherited: false
      };
    }
  } else if (companyType) {
    // Only company has type
    return {
      type: companyType,
      source: 'company',
      inherited: true
    };
  } else if (individualType) {
    // Only contact has type
    return {
      type: individualType,
      source: 'individual',
      inherited: false
    };
  } else {
    // Neither has type
    return {
      type: null,
      source: null,
      inherited: false
    };
  }
}

/**
 * Updates contact entity type with auto-sync logic
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
 * Updates company entity type with auto-sync logic
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