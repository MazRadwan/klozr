"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Plus, RefreshCw, MessageSquare } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { QuickActions } from './QuickActions';
import { CreateActivityModal } from './CreateActivityModal';

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

interface ActivityFeedProps {
  entityType: 'contact' | 'company' | 'deal';
  entityId: number;
  userId: number;
  showQuickActions?: boolean;
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  entityType,
  entityId,
  userId,
  showQuickActions = true,
  maxItems,
  className = ''
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'call' | 'email' | 'note' | 'meeting' | 'task'>('note');
  const [replyToActivityId, setReplyToActivityId] = useState<number | null>(null);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/${entityType}s/${entityId}/activities?include_user=true&include_participants=false`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  // Handle create activity
  const handleCreateActivity = async (activityData: any) => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activityData,
          user_id: userId,
          parent_id: replyToActivityId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }

      // Refresh activities
      await fetchActivities();
      setReplyToActivityId(null);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };

  // Quick action handlers
  const handleQuickAction = (type: 'call' | 'email' | 'note' | 'meeting' | 'task') => {
    setCreateModalType(type);
    setReplyToActivityId(null);
    setIsCreateModalOpen(true);
  };

  // Reply handler
  const handleReply = (activityId: number) => {
    setReplyToActivityId(activityId);
    setCreateModalType('note'); // Default to note for replies
    setIsCreateModalOpen(true);
  };

  // Follow-up handler
  const handleFollowUp = (activityId: number) => {
    setReplyToActivityId(activityId);
    setCreateModalType('task'); // Default to task for follow-ups
    setIsCreateModalOpen(true);
  };

  // Group activities by thread
  const getThreadedActivities = () => {
    const threaded: { [key: number]: Activity[] } = {};
    const orphans: Activity[] = [];

    activities.forEach(activity => {
      if (activity.parent_id) {
        if (!threaded[activity.parent_id]) {
          threaded[activity.parent_id] = [];
        }
        threaded[activity.parent_id].push(activity);
      } else {
        orphans.push(activity);
      }
    });

    // Sort children by creation date
    Object.keys(threaded).forEach(parentId => {
      threaded[parseInt(parentId)].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return { threaded, orphans };
  };

  const { threaded, orphans } = getThreadedActivities();
  const displayActivities = maxItems ? orphans.slice(0, maxItems) : orphans;

  if (loading) {
    return (
      <Card className={`bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Clock className="h-5 w-5" />
            Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Clock className="h-5 w-5" />
            Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-8 w-8 text-red-400 dark:text-red-600" />
            <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activities ({activities.length})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchActivities}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {showQuickActions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('note')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Actions */}
          {showQuickActions && (
            <>
              <QuickActions
                onLogCall={() => handleQuickAction('call')}
                onSendEmail={() => handleQuickAction('email')}
                onAddNote={() => handleQuickAction('note')}
                onScheduleMeeting={() => handleQuickAction('meeting')}
                onCreateTask={() => handleQuickAction('task')}
                disabled={loading}
              />
              <Separator />
            </>
          )}

          {/* Activities Feed */}
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                No activities yet.
              </p>
              {showQuickActions && (
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Use the quick actions above to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayActivities.map((activity) => (
                <div key={activity.id} className="space-y-2">
                  <ActivityCard
                    activity={activity}
                    onReply={handleReply}
                    onFollowUp={handleFollowUp}
                    showActions={true}
                  />
                  
                  {/* Thread children */}
                  {threaded[activity.id] && threaded[activity.id].length > 0 && (
                    <div className="space-y-2">
                      {threaded[activity.id].map((childActivity) => (
                        <ActivityCard
                          key={childActivity.id}
                          activity={childActivity}
                          onReply={handleReply}
                          onFollowUp={handleFollowUp}
                          showActions={true}
                          isChild={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show more button */}
              {maxItems && activities.length > maxItems && (
                <div className="text-center pt-3">
                  <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                    View All Activities ({activities.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setReplyToActivityId(null);
        }}
        onSubmit={handleCreateActivity}
        initialType={createModalType}
        entityType={entityType}
        entityId={entityId}
        userId={userId}
        parentActivityId={replyToActivityId}
      />
    </>
  );
}