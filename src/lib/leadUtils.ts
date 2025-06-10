// Lead status management utilities
// Simplified for bidirectional sync approach

export const LEAD_STATUSES = [
  'prospect',
  'qualified', 
  'opportunity',
  'customer',
  'lost'
] as const;

export const LEAD_TEMPERATURES = [
  'cold',
  'warm', 
  'hot'
] as const;

export const LEAD_SOURCES = [
  'website',
  'referral',
  'cold_call',
  'trade_show',
  'social_media',
  'email_campaign',
  'content_marketing',
  'partner',
  'other'
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadTemperature = typeof LEAD_TEMPERATURES[number];
export type LeadSource = typeof LEAD_SOURCES[number];

/**
 * Gets the color classes for lead status badges
 */
export function getLeadStatusColor(status?: string): string {
  const colors = {
    'prospect': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    'qualified': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    'opportunity': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    'customer': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
    'lost': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
}

/**
 * Gets the color classes for lead temperature badges
 */
export function getLeadTemperatureColor(temperature?: string): string {
  const colors = {
    'cold': 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:hover:bg-slate-900/30 border-slate-200 dark:border-slate-800',
    'warm': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    'hot': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
  };
  return colors[temperature as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
}

/**
 * Determines if lead status should be displayed based on entity type
 */
export function shouldShowLeadStatusForEntity(entityType?: string | null): boolean {
  return entityType === 'lead';
}

/**
 * Gets lead status for a contact - simplified (no inheritance)
 * In bidirectional sync, contact.lead_status is always the actual value
 */
export function getContactLeadStatus(contact: {
  lead_status?: string | null;
  type?: string | null;
}): { status: string | null; shouldShow: boolean } {
  const shouldShow = shouldShowLeadStatusForEntity(contact.type);
  return {
    status: contact.lead_status || null,
    shouldShow
  };
}

/**
 * Gets lead status for a company - simplified (no inheritance)
 */
export function getCompanyLeadStatus(company: {
  lead_status?: string | null;
  type?: string | null;
}): { status: string | null; shouldShow: boolean } {
  const shouldShow = shouldShowLeadStatusForEntity(company.type);
  return {
    status: company.lead_status || null,
    shouldShow
  };
}

/**
 * Updates contact lead status with bidirectional sync
 */
export async function updateContactLeadStatus(
  contactId: number,
  leadData: {
    status?: LeadStatus | null;
    temperature?: LeadTemperature | null;
    source?: LeadSource | null;
    ownerId?: number | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/contacts/${contactId}/lead`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
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
    console.error('Error updating contact lead status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lead status'
    };
  }
}

/**
 * Updates company lead status with bidirectional sync
 */
export async function updateCompanyLeadStatus(
  companyId: number,
  leadData: {
    status?: LeadStatus | null;
    temperature?: LeadTemperature | null;
    source?: LeadSource | null;
    ownerId?: number | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/companies/${companyId}/lead`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
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
    console.error('Error updating company lead status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lead status'
    };
  }
}

/**
 * Simplified lead count query (no complex inheritance logic needed)
 */
export const LEAD_COUNT_QUERY = `
  SELECT COUNT(*) as total_leads FROM (
    -- Company leads
    SELECT id as entity_id, 'company' as type, lead_status 
    FROM companies 
    WHERE type = 'lead' AND lead_status IS NOT NULL

    UNION

    -- Individual contact leads (no company)
    SELECT id as entity_id, 'contact' as type, lead_status
    FROM contacts 
    WHERE type = 'lead' AND company_id IS NULL AND lead_status IS NOT NULL
  )
`;

/**
 * Convert individual contact lead to company lead
 */
export async function convertToCompanyLead(
  contactId: number,
  companyData: {
    name: string;
    leadStatus: LeadStatus;
    leadTemperature?: LeadTemperature;
    leadSource?: LeadSource;
    ownerId?: number;
  }
): Promise<{ success: boolean; companyId?: number; error?: string }> {
  try {
    const response = await fetch(`/api/contacts/${contactId}/convert-to-company-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const result = await response.json();
    return { 
      success: true, 
      companyId: result.companyId 
    };
  } catch (error) {
    console.error('Error converting to company lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to company lead'
    };
  }
}