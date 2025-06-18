import React from "react";

interface KanbanBoardProps {
  deals: any[];
}

export function KanbanBoard({ deals }: KanbanBoardProps) {
  return (
    <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-400/40 rounded-lg text-gray-500 dark:text-gray-400">
      Kanban view coming soon – {deals.length} deals loaded
    </div>
  );
} 