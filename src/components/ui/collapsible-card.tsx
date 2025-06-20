"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isEmpty?: boolean;
  onAdd?: () => void;
  addButtonText?: string;
  summary?: React.ReactNode;
  className?: string;
}

export function CollapsibleCard({
  title,
  icon,
  children,
  defaultExpanded = false,
  isEmpty = false,
  onAdd,
  addButtonText,
  summary,
  className = ""
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            {icon}
            {title}
            {isEmpty && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (Not assigned)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEmpty && onAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                {addButtonText || `Add ${title}`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Summary when collapsed and not empty */}
        {!isExpanded && !isEmpty && summary && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {summary}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}