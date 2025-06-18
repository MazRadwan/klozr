"use client";

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Calendar, Building2, User, GripVertical } from 'lucide-react';

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
  // Get the accent color for the stage
  const getStageAccentColor = (stage?: string): string => {
    const colors = {
      'Prospecting': 'bg-blue-500',
      'Qualification': 'bg-yellow-500', 
      'Proposal': 'bg-purple-500',
      'Negotiation': 'bg-orange-500',
      'Closed Won': 'bg-green-500',
      'Closed Lost': 'bg-red-500',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-400';
  };

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
            "relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            "rounded-lg pl-5 pr-4 py-4 shadow-sm transition-shadow duration-200",
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
              // Validate that deal.id is a number to prevent XSS
              const dealId = Number(deal.deal.id);
              if (dealId && dealId > 0) {
                window.location.href = `/dashboard/deals/${dealId}`;
              }
            }
          }}
        >
          {/* Stage Accent Stripe */}
          <div className={cn(
            "absolute left-0 top-0 w-1 h-full rounded-l-lg",
            getStageAccentColor(deal.deal.stage)
          )} />

          {/* Drag Handle */}
          <div className="absolute top-3 right-3 text-gray-400 dark:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Deal Title */}
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-3 pr-6">
            {deal.deal.title}
          </div>

          {/* Deal Amount */}
          {deal.deal.amount && (
            <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
              ${deal.deal.amount.toLocaleString()}
            </div>
          )}

          {/* Company or Contact (fallback) */}
          {deal.company?.name ? (
            <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
              <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="truncate font-medium">{deal.company.name}</span>
            </div>
          ) : deal.contact && (deal.contact.first_name || deal.contact.last_name) ? (
            <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
              <User className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="truncate font-medium">
                {deal.contact.first_name} {deal.contact.last_name}
              </span>
            </div>
          ) : null}

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