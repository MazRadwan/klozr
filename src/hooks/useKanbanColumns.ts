import { useQuery } from "@tanstack/react-query";

export interface DealColumn {
  stage: string;
  deals: any[]; // we can refine later
}

export function useKanbanColumns(searchTerm?: string, stageFilter?: string) {
  return useQuery<DealColumn[]>({
    queryKey: ["deals", "kanban", searchTerm, stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (stageFilter && stageFilter !== "all") params.set("stage", stageFilter);
      
      const url = `/api/deals/kanban${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load kanban data");
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });
} 