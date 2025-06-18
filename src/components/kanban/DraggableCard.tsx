"use client";

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Calendar, Building2, GripVertical } from 'lucide-react';

interface Deal {
  deal: {
    id: number;
    title: string;
    amount?: number;
    stage?: string;
    close_date?: string;
    deal_notes?: string;
    created_at?: string;
  };
  contact?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  company?: {
    id: number;
    name?: string;
  };
  offering?: {
    id: number;
    name?: string;
    type?: string;
  };
}

interface DraggableCardProps {
  deal: Deal;
  index: number;
  isDragDisabled?: boolean;
}

export function DraggableCard({ deal, index, isDragDisabled = false }: DraggableCardProps) {
  return (
    <Draggable 
      draggableId={String(deal.deal.id)} 
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={cn(
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            "rounded-lg p-4 shadow-sm transition-shadow duration-200",
            "cursor-grab active:cursor-grabbing group select-none",
            "hover:shadow-md",
            snapshot.isDragging && "shadow-lg border-blue-300 dark:border-blue-600",
            isDragDisabled && "opacity-50 cursor-not-allowed"
          )}
          onMouseDown={(e) => {
            // Prevent navigation when starting to drag
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Only navigate if not dragging and it's a simple click
            if (!snapshot.isDragging && !isDragDisabled) {
              window.location.href = `/dashboard/deals/${deal.deal.id}`;
            }
          }}
        >

          {/* Deal Title */}
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-3">
            {deal.deal.title}
          </div>

          {/* Deal Amount */}
          {deal.deal.amount && (
            <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
              ${deal.deal.amount.toLocaleString()}
            </div>
          )}

          {/* Company */}
          {deal.company?.name && (
            <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
              <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="truncate font-medium">{deal.company.name}</span>
            </div>
          )}

          {/* Close Date */}
          {deal.deal.close_date && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 mt-3">
              <Calendar className="h-3 w-3 text-orange-500" />
              <span>{new Date(deal.deal.close_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}