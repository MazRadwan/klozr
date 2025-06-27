"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ActivityIcon } from "./ActivityIcon";

export type ActivityType = 'call' | 'email' | 'note' | 'meeting' | 'task';

interface ActivityTypeFilterProps {
  selectedTypes: ActivityType[];
  onTypesChange: (types: ActivityType[]) => void;
  className?: string;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string }[] = [
  { type: 'call', label: 'Calls' },
  { type: 'email', label: 'Emails' },
  { type: 'note', label: 'Notes' },
  { type: 'meeting', label: 'Meetings' },
  { type: 'task', label: 'Tasks' },
];

export function ActivityTypeFilter({
  selectedTypes,
  onTypesChange,
  className = ""
}: ActivityTypeFilterProps) {
  const handleTypeToggle = (type: ActivityType) => {
    if (selectedTypes.includes(type)) {
      // Remove type
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      // Add type
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleClearAll = () => {
    onTypesChange([]);
  };

  const hasFilters = selectedTypes.length > 0;
  const isAllSelected = selectedTypes.length === ACTIVITY_TYPES.length;
  const getButtonText = () => {
    if (!hasFilters) return 'Filter by type';
    if (isAllSelected) return 'All types';
    if (selectedTypes.length === 1) return `${ACTIVITY_TYPES.find(t => t.type === selectedTypes[0])?.label}`;
    return `${selectedTypes.length} types`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${hasFilters ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400' : ''} ${className}`}
        >
          <ActivityIcon 
            type={selectedTypes.length === 1 ? selectedTypes[0] : 'note'} 
            size="sm" 
            iconOnly={true}
            className="mr-2"
          />
          {getButtonText()}
          {hasFilters && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-4 w-4 p-0 text-xs bg-blue-500 dark:bg-blue-600 text-white border-0 flex items-center justify-center"
            >
              {selectedTypes.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
      >
        {ACTIVITY_TYPES.map((activityType) => (
          <DropdownMenuCheckboxItem
            key={activityType.type}
            checked={selectedTypes.includes(activityType.type)}
            onCheckedChange={() => handleTypeToggle(activityType.type)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ActivityIcon 
              type={activityType.type} 
              size="sm" 
              iconOnly={true}
            />
            <span>{activityType.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
        {hasFilters && (
          <>
            <DropdownMenuItem
              onClick={handleClearAll}
              className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-1 pt-2"
            >
              <X className="h-3 w-3 mr-2" />
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}