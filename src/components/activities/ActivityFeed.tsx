"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Plus, RefreshCw, MessageSquare } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivitySearchBar } from './ActivitySearchBar';
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
  onRefresh?: (refreshFn: () => void) => void;
}

export function ActivityFeed({
  entityType,
  entityId,
  userId,
  showQuickActions = true,
  maxItems,
  className = '',
  onRefresh
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'call' | 'email' | 'note' | 'meeting' | 'task'>('note');
  const [replyToActivityId, setReplyToActivityId] = useState<number | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Lazy loading state
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Fetch activities with pagination and search
  const fetchActivities = async (pageNum = 0, append = false, searchQuery?: string) => {
    try {
      if (!append) {
        // Show the full-page loader only for the initial fetch or manual refresh.
        // When a search query is present we keep the feed visible so the input
        // remains focused and the UI doesn't "freeze" while results load.
        if (!searchQuery || !searchQuery.trim()) {
          setLoading(true);
        }

        setError(null);
        setPage(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      const offset = pageNum * ITEMS_PER_PAGE;
      const entityEndpoint = entityType === 'company' ? 'companies' : `${entityType}s`;
      
      // Build query parameters
      const params = new URLSearchParams({
        include_user: 'true',
        include_participants: 'false',
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString()
      });
      
      // Add search parameter if provided
      const currentSearch = searchQuery !== undefined ? searchQuery : searchTerm;
      if (currentSearch && currentSearch.trim()) {
        params.append('q', currentSearch.trim());
      }
      
      const response = await fetch(`/api/${entityEndpoint}/${entityId}/activities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (append) {
        // Merge without duplicates to prevent React key collisions
        setActivities(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const uniqueNew = data.filter((a: Activity) => !existingIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setActivities(data);
      }
      
      // Check if we have more data
      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
      
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more activities
  const loadMoreActivities = async () => {
    if (!hasMore || loadingMore) return;
    await fetchActivities(page + 1, true);
  };

  // Intersection observer for lazy loading
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastActivityElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreActivities();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Search handler
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    // Reset pagination and fetch with new search term
    fetchActivities(0, false, term).finally(() => {
      setIsSearching(false);
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh(() => fetchActivities(0, false, searchTerm));
    }
  }, [onRefresh, searchTerm]);

  // Handle create activity
  const handleCreateActivity = async (activityData: any) => {
    try {
      const entityEndpoint = entityType === 'company' ? 'companies' : `${entityType}s`;
      const response = await fetch(`/api/${entityEndpoint}/${entityId}/activities`, {
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
      await fetchActivities(0, false, searchTerm);
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
              onClick={() => fetchActivities(0, false, searchTerm)}
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
                onClick={() => fetchActivities(0, false, searchTerm)}
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

        <CardContent className="space-y-4 max-h-[72rem] overflow-y-auto">
          {/* Search Bar */}
          <ActivitySearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            isLoading={isSearching}
            placeholder="Search activities by title or content..."
          />
          
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
                {searchTerm ? `No activities found for "${searchTerm}"` : 'No activities yet.'}
              </p>
              {!searchTerm && showQuickActions && (
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Use the quick actions above to get started.
                </p>
              )}
              {searchTerm && (
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Try searching for different terms or clear the search to see all activities.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="space-y-2"
                  ref={index === displayActivities.length - 1 ? lastActivityElementRef : null}
                >
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
              
              {/* Loading indicator for lazy loading */}
              {loadingMore && (
                <div className="text-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-500 text-xs mt-1">Loading more activities...</p>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMore && activities.length > ITEMS_PER_PAGE && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-xs">No more activities to load</p>
                </div>
              )}
              
              {/* Show more button (for maxItems display limit) */}
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
        parentActivityId={replyToActivityId ?? undefined}
      />
    </>
  );
}