"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, Mail, FileText, Calendar, CheckSquare 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickActionsProps {
  onLogCall: () => void;
  onSendEmail: () => void;
  onAddNote: () => void;
  onScheduleMeeting: () => void;
  onCreateTask: () => void;
  disabled?: boolean;
}

export function QuickActions({
  onLogCall,
  onSendEmail,
  onAddNote,
  onScheduleMeeting,
  onCreateTask,
  disabled = false
}: QuickActionsProps) {
  const actions = [
    {
      icon: Phone,
      label: 'Log Call',
      onClick: onLogCall,
      color: 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
    },
    {
      icon: Mail,
      label: 'Send Email',
      onClick: onSendEmail,
      color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
    },
    {
      icon: FileText,
      label: 'Add Note',
      onClick: onAddNote,
      color: 'hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900/20 dark:hover:text-gray-400'
    },
    {
      icon: Calendar,
      label: 'Schedule Meeting',
      onClick: onScheduleMeeting,
      color: 'hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400'
    },
    {
      icon: CheckSquare,
      label: 'Create Task',
      onClick: onCreateTask,
      color: 'hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
    }
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  disabled={disabled}
                  className={`h-10 w-10 p-0 text-gray-600 dark:text-gray-400 ${action.color} transition-colors`}
                >
                  <IconComponent className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}