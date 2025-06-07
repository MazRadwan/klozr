"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { 
  LEAD_STATUSES, 
  LeadStatus, 
  getLeadStatusColor, 
  getEffectiveLeadStatus,
  updateContactLeadStatus,
  updateCompanyLeadStatus
} from '@/lib/leadUtils';

interface LeadStatusDropdownProps {
  entityType: 'contact' | 'company';
  entityId: number;
  contact?: {
    individual_lead_status?: string | null;
    company_id?: number | null;
    company?: { lead_status?: string | null } | null;
  };
  company?: {
    lead_status?: string | null;
  };
  onStatusUpdate?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadStatusDropdown({
  entityType,
  entityId,
  contact,
  company,
  onStatusUpdate,
  disabled = false,
  size = 'sm'
}: LeadStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current effective status
  const currentStatus = (() => {
    if (entityType === 'company' && company) {
      return company.lead_status;
    } else if (entityType === 'contact' && contact) {
      const effective = getEffectiveLeadStatus(contact);
      return effective.status;
    }
    return null;
  })();

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (isUpdating || disabled) return;

    setIsUpdating(true);
    setError(null);

    try {
      let result;
      if (entityType === 'contact') {
        result = await updateContactLeadStatus(entityId, { status: newStatus });
      } else {
        result = await updateCompanyLeadStatus(entityId, { status: newStatus });
      }

      if (!result.success) {
        setError(result.error || 'Failed to update lead status');
      } else {
        onStatusUpdate?.();
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

  const getInheritanceInfo = () => {
    if (entityType === 'contact' && contact) {
      const effective = getEffectiveLeadStatus(contact);
      return effective;
    }
    return { status: currentStatus, source: null, inherited: false };
  };

  const inheritanceInfo = getInheritanceInfo();

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
          {currentStatus ? (
            <Button
              variant="ghost"
              size="sm"
              className={`
                ${getLeadStatusColor(currentStatus)} 
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
                    <span>{currentStatus}</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </div>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={`
                ${getSizeClasses()}
                ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                border-dashed text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
              `}
            >
              <div className="flex items-center gap-2">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Add Lead Status</span>
                  </>
                )}
              </div>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {LEAD_STATUSES.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={status === currentStatus || isUpdating}
              className={`
                ${status === currentStatus ? 'bg-gray-100 dark:bg-gray-800' : ''}
                ${isUpdating ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-2 w-full">
                <div className={`w-2 h-2 rounded-full ${getLeadStatusColor(status).split(' ')[0]}`} />
                <span className="text-sm capitalize">{status}</span>
                {status === currentStatus && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          {currentStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusChange(null as any)}
                disabled={isUpdating}
                className="text-red-600 dark:text-red-400"
              >
                Remove Lead Status
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Show inheritance info for contacts */}
      {entityType === 'contact' && inheritanceInfo.inherited && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Inherited from {inheritanceInfo.source}
        </div>
      )}
      
      {/* Show error */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
} 