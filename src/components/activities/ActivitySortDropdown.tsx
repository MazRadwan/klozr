"use client";

import React from "react";
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortField = 'created_at' | 'title' | 'activity_type' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
  label: string;
}

interface ActivitySortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'created_at', order: 'desc', label: 'Newest first' },
  { field: 'created_at', order: 'asc', label: 'Oldest first' },
  { field: 'title', order: 'asc', label: 'Title A-Z' },
  { field: 'title', order: 'desc', label: 'Title Z-A' },
  { field: 'activity_type', order: 'asc', label: 'Type A-Z' },
  { field: 'activity_type', order: 'desc', label: 'Type Z-A' },
  { field: 'status', order: 'asc', label: 'Status A-Z' },
  { field: 'status', order: 'desc', label: 'Status Z-A' },
];

export function ActivitySortDropdown({
  currentSort,
  onSortChange,
  className = ""
}: ActivitySortDropdownProps) {
  const getSortIcon = (option: SortOption) => {
    if (option.field !== currentSort.field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return option.order === 'asc' ? 
      <ArrowUp className="h-3 w-3 text-blue-600 dark:text-blue-400" /> : 
      <ArrowDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
  };

  const getCurrentLabel = () => {
    // Return empty string to show only icon
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-8 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
          title={`Sort: ${SORT_OPTIONS.find(opt => opt.field === currentSort.field && opt.order === currentSort.order)?.label || 'Sort by'}`}
        >
          <ArrowUpDown className="h-3 w-3" />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
      >
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={`${option.field}-${option.order}`}
            onClick={() => onSortChange(option)}
            className={`
              flex items-center justify-between cursor-pointer
              text-gray-700 dark:text-gray-300 
              hover:bg-gray-100 dark:hover:bg-gray-800
              ${option.field === currentSort.field && option.order === currentSort.order 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : ''
              }
            `}
          >
            <span>{option.label}</span>
            {getSortIcon(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}