"use client";

import { useLocalStorage } from './useLocalStorage';

export type ViewMode = 'table' | 'kanban';

/**
 * Custom hook for persisting view mode preference across sessions
 * @param defaultMode - default view mode (defaults to 'table')
 * @returns [viewMode, setViewMode] tuple
 */
export function useViewMode(defaultMode: ViewMode = 'table'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('deals-view-mode', defaultMode);

  return [viewMode, setViewMode];
}