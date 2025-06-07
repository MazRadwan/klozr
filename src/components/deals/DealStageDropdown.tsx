"use client";

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';
import { DEAL_STAGES, DealStage, getDealStageColor, useDealStageUpdate } from '@/lib/dealUtils';

interface DealStageDropdownProps {
  dealId: number;
  currentStage: string;
  onStageUpdate?: (updatedDeal: any) => void;
  variant?: 'badge' | 'button';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function DealStageDropdown({
  dealId,
  currentStage,
  onStageUpdate,
  variant = 'badge',
  size = 'md',
  disabled = false
}: DealStageDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateStage } = useDealStageUpdate(onStageUpdate);

  const handleStageChange = async (newStage: DealStage) => {
    if (isUpdating || disabled || newStage === currentStage) return;

    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateStage(dealId, newStage);
      
      if (!result.success) {
        setError(result.error || 'Failed to update stage');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2', 
      lg: 'text-base px-5 py-2.5'
    };
    return sizeMap[size];
  };

  if (variant === 'badge') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
          <Button
            variant="ghost"
            size="sm"
            className={`
              ${getDealStageColor(currentStage)} 
              ${getSizeClasses()}
              transition-all duration-200 
              hover:opacity-80 
              border rounded-full
              ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              h-auto font-medium
            `}
          >
            <div className="flex items-center gap-1">
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <span>{currentStage || 'Unknown'}</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40">
          {DEAL_STAGES.map((stage) => (
            <DropdownMenuItem
              key={stage}
              onClick={() => handleStageChange(stage)}
              disabled={stage === currentStage || isUpdating}
              className={`
                ${stage === currentStage ? 'bg-gray-100 dark:bg-gray-800' : ''}
                ${isUpdating ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-2 w-full">
                <div className={`w-2 h-2 rounded-full ${getDealStageColor(stage).split(' ')[0]}`} />
                <span className="text-sm">{stage}</span>
                {stage === currentStage && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Button variant (for kanban or other uses)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <Button
          variant="outline"
          size="sm"
          className={`
            ${getSizeClasses()}
            ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className={`w-2 h-2 rounded-full ${getDealStageColor(currentStage).split(' ')[0]}`} />
                <span>{currentStage || 'Unknown'}</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {DEAL_STAGES.map((stage) => (
          <DropdownMenuItem
            key={stage}
            onClick={() => handleStageChange(stage)}
            disabled={stage === currentStage || isUpdating}
            className={`
              ${stage === currentStage ? 'bg-gray-100 dark:bg-gray-800' : ''}
              ${isUpdating ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={`w-3 h-3 rounded-full ${getDealStageColor(stage).split(' ')[0]}`} />
              <span>{stage}</span>
              {stage === currentStage && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export error display component for optional use
export function DealStageDropdownError({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
      <span>{error}</span>
      <button
        onClick={onDismiss}
        className="ml-1 hover:text-red-800 dark:hover:text-red-300"
      >
        ×
      </button>
    </div>
  );
} 