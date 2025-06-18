+"use client";
import React from "react";
import { DragDropContext } from '@hello-pangea/dnd';
import { useKanbanColumns } from "@/hooks/useKanbanColumns";
import { useKanbanDragDrop } from "@/hooks/useKanbanDragDrop";
import { DraggableCard } from './DraggableCard';
import { DroppableColumn } from './DroppableColumn';

interface KanbanBoardProps {
  searchTerm?: string;
  stageFilter?: string;
}

export function KanbanBoard({ searchTerm, stageFilter }: KanbanBoardProps) {
  const { data, isLoading, error } = useKanbanColumns(searchTerm, stageFilter);
  const { handleDragStart, handleDragEnd, isDragging, isUpdating } = useKanbanDragDrop();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex gap-6 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-80 shrink-0 bg-gray-100 dark:bg-gray-900/40 rounded-lg p-4 animate-pulse h-[500px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-12">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-sm mb-2">
            Failed to load kanban board
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  const totalDeals = data.reduce((sum, col) => sum + col.deals.length, 0);

  return (
    <DragDropContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
      {/* Kanban Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Deal Pipeline
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalDeals} {totalDeals === 1 ? 'deal' : 'deals'} total
            {(isDragging || isUpdating) && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                {isDragging ? '(Dragging...)' : '(Updating...)'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {data.map((col) => (
            <div
              key={col.stage}
              className="w-80 shrink-0 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {col.stage}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                    {col.deals.length}
                  </span>
                </div>
              </div>

              {/* Droppable Column Content */}
              <DroppableColumn stage={col.stage}>
                {col.deals.map((deal, index) => (
                  <DraggableCard
                    key={deal.deal.id}
                    deal={deal}
                    index={index}
                    isDragDisabled={isUpdating}
                  />
                ))}
              </DroppableColumn>
            </div>
          ))}
        </div>
      </div>
      </div>
    </DragDropContext>
  );
} 