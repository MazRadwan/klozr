"use client";

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Calendar, Building2, User } from 'lucide-react';

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
          className={cn(
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            "rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200",
            "cursor-pointer group select-none",
            snapshot.isDragging && "rotate-3 scale-105 shadow-lg z-50",
            isDragDisabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => {
            // Prevent navigation during drag
            if (!snapshot.isDragging) {
              window.location.href = `/dashboard/deals/${deal.deal.id}`;
            }
          }}
        >
          {/* Deal Title */}
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {deal.deal.title}
          </div>

          {/* Deal Amount */}
          {deal.deal.amount && (
            <div className="text-green-600 dark:text-green-400 font-semibold text-sm mb-2">
              ${deal.deal.amount.toLocaleString()}
            </div>
          )}

          {/* Company & Contact */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {deal.company?.name && (
              <div className="flex items-center space-x-1 truncate">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{deal.company.name}</span>
              </div>
            )}
            {deal.contact && (
              <div className="flex items-center space-x-1 truncate">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {deal.contact.first_name} {deal.contact.last_name}
                </span>
              </div>
            )}
          </div>

          {/* Close Date */}
          {deal.deal.close_date && (
            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Close: {new Date(deal.deal.close_date).toLocaleDateString()}</span>
            </div>
          )}

          {/* Drag Handle Indicator */}
          {!isDragDisabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
              <div className="flex flex-col space-y-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}