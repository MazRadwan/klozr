"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, Mail, FileText, Calendar, CheckSquare, Loader2 
} from 'lucide-react';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (activityData: CreateActivityData) => Promise<void>;
  initialType?: 'call' | 'email' | 'note' | 'meeting' | 'task';
  entityType: 'contact' | 'company' | 'deal';
  entityId: number;
  userId: number;
  parentActivityId?: number;
}

interface CreateActivityData {
  activity_type: 'call' | 'email' | 'note' | 'meeting' | 'task';
  title?: string;
  content?: string;
  status: 'completed' | 'scheduled';
  scheduled_at?: string;
  data?: Record<string, any>;
}

export function CreateActivityModal({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'note',
  entityType,
  entityId,
  userId,
  parentActivityId
}: CreateActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note' | 'meeting' | 'task'>(initialType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'completed' | 'scheduled'>('completed');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Call-specific fields
  const [duration, setDuration] = useState('');
  const [outcome, setOutcome] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      setActivityType(initialType);
      setTitle('');
      setContent('');
      setStatus('completed');
      setScheduledDate('');
      setScheduledTime('');
      setDuration('');
      setOutcome('');
      setSentiment('neutral');
    }
  }, [isOpen, initialType]);

  const getActivityIcon = (type: string) => {
    switch (type) {
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
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'call':
        return 'Log Call';
      case 'email':
        return 'Log Email';
      case 'note':
        return 'Add Note';
      case 'meeting':
        return 'Schedule Meeting';
      case 'task':
        return 'Create Task';
      default:
        return 'Create Activity';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const activityData: CreateActivityData = {
        activity_type: activityType,
        title: title.trim() || undefined,
        content: content.trim(),
        status,
        scheduled_at: status === 'scheduled' && scheduledDate && scheduledTime 
          ? `${scheduledDate}T${scheduledTime}:00`
          : undefined,
      };

      // Add call-specific data
      if (activityType === 'call') {
        activityData.data = {
          duration: duration ? parseInt(duration) : undefined,
          outcome: outcome.trim() || undefined,
          sentiment,
        };
      }

      await onSubmit(activityData);
      onClose();
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActivityIcon(activityType)}
            {getActivityLabel(activityType)}
            {parentActivityId && ' (Reply)'}
          </DialogTitle>
          <DialogDescription>
            Create a new activity for this {entityType}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={(value: any) => setActivityType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Note
                  </div>
                </SelectItem>
                <SelectItem value="call">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="meeting">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Meeting
                  </div>
                </SelectItem>
                <SelectItem value="task">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Task
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${activityType} title...`}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {activityType === 'note' ? 'Note' : 
               activityType === 'call' ? 'Call Notes' :
               activityType === 'email' ? 'Email Content' :
               activityType === 'meeting' ? 'Meeting Notes' :
               'Task Description'} *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter ${activityType} details...`}
              rows={4}
              required
            />
          </div>

          {/* Call-specific fields */}
          {activityType === 'call' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Input
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="e.g., Interested"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="sentiment">Sentiment</Label>
                <Select value={sentiment} onValueChange={(value: any) => setSentiment(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled date/time */}
          {status === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">Date</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">Time</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === 'scheduled' ? 'Schedule' : 'Create'} {activityType === 'note' ? 'Note' : 
               activityType === 'call' ? 'Call' :
               activityType === 'email' ? 'Email' :
               activityType === 'meeting' ? 'Meeting' : 'Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}