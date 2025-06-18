"use client";

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface DroppableColumnProps {
  stage: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableColumn({ stage, children, className }: DroppableColumnProps) {
  return (
    <Droppable droppableId={stage}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]",
            "transition-colors duration-200",
            snapshot.isDraggingOver && "bg-blue-50 dark:bg-blue-950/20",
            className
          )}
        >
          {children}
          {provided.placeholder}
          
          {/* Simple Empty State */}
          {React.Children.count(children) === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-600 text-sm">
                No deals in this stage
              </div>
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
}