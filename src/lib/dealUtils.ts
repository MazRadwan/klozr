// Utility functions for deal stage management
// This can be used by both table view and kanban view to avoid redundant API logic

export const DEAL_STAGES = [
  'Prospecting',
  'Qualification', 
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
] as const;

export type DealStage = typeof DEAL_STAGES[number];

export interface DealStageUpdateResponse {
  success: boolean;
  deal?: any;
  error?: string;
}

/**
 * Updates a deal's stage in the database
 * Can be used by table view, kanban view, or any other component
 */
export async function updateDealStage(
  dealId: number, 
  newStage: DealStage
): Promise<DealStageUpdateResponse> {
  try {
    const response = await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stage: newStage }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const updatedDeal = await response.json();
    return {
      success: true,
      deal: updatedDeal
    };
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update deal stage'
    };
  }
}

/**
 * Gets the color classes for a deal stage badge
 * Consistent across table and kanban views
 */
export function getDealStageColor(stage?: string): string {
  const colors = {
    'Prospecting': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
    'Qualification': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
    'Proposal': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
    'Negotiation': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
    'Closed Won': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
    'Closed Lost': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
}

/**
 * Custom hook for managing deal stage updates with optimistic updates
 * Provides loading state and error handling
 */
export function useDealStageUpdate(onUpdate?: (updatedDeal: any) => void) {
  const updateStage = async (dealId: number, newStage: DealStage) => {
    const result = await updateDealStage(dealId, newStage);
    
    if (result.success && result.deal && onUpdate) {
      onUpdate(result.deal);
    }
    
    return result;
  };

  return { updateStage };
} 