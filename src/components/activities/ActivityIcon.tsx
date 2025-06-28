import React from 'react';
import { 
  Phone, Mail, FileText, Calendar, CheckSquare, MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityType = 'call' | 'email' | 'note' | 'meeting' | 'task';

export interface ActivityIconProps {
  type: ActivityType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export function ActivityIcon({ 
  type, 
  size = 'md', 
  className,
  iconOnly = false 
}: ActivityIconProps) {
  // Get the appropriate icon component
  const getIcon = () => {
    switch (type) {
      case 'call':
        return Phone;
      case 'email':
        return Mail;
      case 'note':
        return FileText;
      case 'meeting':
        return Calendar;
      case 'task':
        return CheckSquare;
      default:
        return MessageSquare;
    }
  };

  // Get activity type colors
  const getActivityColor = () => {
    switch (type) {
      case 'call':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'email':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'note':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      case 'meeting':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'task':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-6 w-6',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          container: 'h-10 w-10',
          icon: 'h-5 w-5'
        };
      default: // md
        return {
          container: 'h-8 w-8',
          icon: 'h-4 w-4'
        };
    }
  };

  const Icon = getIcon();
  const sizeClasses = getSizeClasses();

  // If iconOnly is true, return just the icon without the container
  if (iconOnly) {
    return (
      <Icon 
        className={cn(sizeClasses.icon, className)} 
      />
    );
  }

  // Return the icon with colored background container
  return (
    <div className={cn(
      'flex items-center justify-center rounded-full',
      getActivityColor(),
      sizeClasses.container,
      className
    )}>
      <Icon className={sizeClasses.icon} />
    </div>
  );
}