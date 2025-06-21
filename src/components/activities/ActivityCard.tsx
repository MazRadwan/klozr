"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, Mail, FileText, Calendar, CheckSquare, 
  User, ChevronDown, ChevronUp, Reply, Clock,
  MessageSquare, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActivityUser {
  id: number;
  username: string;
  email: string;
}

interface Activity {
  id: number;
  activity_type: 'call' | 'email' | 'note' | 'meeting' | 'task';
  title?: string | null;
  content?: string | null;
  status: 'completed' | 'scheduled' | 'pending' | 'cancelled';
  scheduled_at?: Date | string | null;
  created_at: Date | string;
  user?: ActivityUser;
  data?: Record<string, any> | null;
  parent_id?: number | null;
}

interface ActivityCardProps {
  activity: Activity;
  onReply?: (activityId: number) => void;
  onFollowUp?: (activityId: number) => void;
  showActions?: boolean;
  isChild?: boolean;
}

export function ActivityCard({ 
  activity, 
  onReply, 
  onFollowUp, 
  showActions = true,
  isChild = false 
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get activity type icon
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get activity type color
  const getActivityColor = () => {
    switch (activity.activity_type) {
      case 'call':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'email':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'note':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      case 'meeting':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'task':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (activity.status === 'scheduled') {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    if (activity.status === 'pending') {
      return (
        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
          Pending
        </Badge>
      );
    }
    return null;
  };

  // Format timestamp
  const formatTimestamp = () => {
    const date = new Date(activity.created_at);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get activity title or generate one
  const getActivityTitle = () => {
    if (activity.title) return activity.title;
    
    switch (activity.activity_type) {
      case 'call':
        return 'Phone Call';
      case 'email':
        return 'Email';
      case 'note':
        return 'Note';
      case 'meeting':
        return 'Meeting';
      case 'task':
        return 'Task';
      default:
        return 'Activity';
    }
  };

  // Get preview content
  const getPreviewContent = () => {
    if (!activity.content) return null;
    
    const maxLength = isExpanded ? 1000 : 150;
    if (activity.content.length <= maxLength) {
      return activity.content;
    }
    
    return activity.content.substring(0, maxLength) + '...';
  };

  const shouldShowExpandButton = activity.content && activity.content.length > 150;

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 ${isChild ? 'ml-8 border-l-2 border-l-blue-200 dark:border-l-blue-800' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Activity Icon */}
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor()}`}>
            {getActivityIcon()}
          </div>
          
          {/* Activity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getActivityTitle()}
              </h4>
              {getStatusBadge()}
              {activity.parent_id && (
                <Badge variant="outline" className="text-xs">
                  Reply
                </Badge>
              )}
            </div>
            
            {/* User and timestamp */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <User className="h-3 w-3" />
              <span className="font-medium">
                {activity.user?.username || 'Unknown User'}
              </span>
              <span>•</span>
              <span>{formatTimestamp()}</span>
              {activity.scheduled_at && activity.status === 'scheduled' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    Due {formatDistanceToNow(new Date(activity.scheduled_at), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(activity.id)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              {onFollowUp && (
                <DropdownMenuItem onClick={() => onFollowUp(activity.id)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Follow Up
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {activity.content && (
        <div className="space-y-2">
          <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {getPreviewContent()}
          </div>
          
          {shouldShowExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 dark:text-blue-400 p-0 h-auto font-normal"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Metadata */}
      {activity.data && Object.keys(activity.data).length > 0 && isExpanded && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {activity.data.duration && (
              <div>Duration: {activity.data.duration} minutes</div>
            )}
            {activity.data.outcome && (
              <div>Outcome: {activity.data.outcome}</div>
            )}
            {activity.data.sentiment && (
              <div>Sentiment: {activity.data.sentiment}</div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions (for completed activities) */}
      {showActions && activity.status === 'completed' && (
        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {onReply && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply(activity.id)}
              className="text-xs"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {onFollowUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFollowUp(activity.id)}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Follow Up
            </Button>
          )}
        </div>
      )}
    </div>
  );
}