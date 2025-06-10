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
  getContactLeadStatus,
  getCompanyLeadStatus,
  updateContactLeadStatus,
  updateCompanyLeadStatus
} from '@/lib/leadUtils';

interface LeadStatusDropdownProps {
  entityType: 'contact' | 'company';
  entityId: number;
  contact?: {
    lead_status?: string | null;
    lead_temperature?: string | null;
    lead_source?: string | null;
    lead_owner_id?: number | null;
    type?: string | null;
  };
  company?: {
    lead_status?: string | null;
    lead_temperature?: string | null;
    lead_source?: string | null;
    lead_owner_id?: number | null;
    type?: string | null;
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

  // Get current status - simplified, no inheritance
  const currentStatus = (() => {
    if (entityType === 'company' && company) {
      const result = getCompanyLeadStatus(company);
      return result.status;
    } else if (entityType === 'contact' && contact) {
      const result = getContactLeadStatus(contact);
      return result.status;
    }
    return null;
  })();

  // Check if lead status should be shown based on entity type
  const shouldShow = (() => {
    if (entityType === 'company' && company) {
      const result = getCompanyLeadStatus(company);
      return result.shouldShow;
    } else if (entityType === 'contact' && contact) {
      const result = getContactLeadStatus(contact);
      return result.shouldShow;
    }
    return false;
  })();

  // If entity type is not 'lead', don't show the dropdown
  if (!shouldShow) {
    return null;
  }

  const handleStatusChange = async (newStatus: LeadStatus | null) => {
    if (isUpdating || disabled) return;

    setIsUpdating(true);
    setError(null);

    try {
      let result;
      if (entityType === 'contact') {
        // Send complete lead data to preserve other fields
        result = await updateContactLeadStatus(entityId, { 
          status: newStatus,
          temperature: contact?.lead_temperature,
          source: contact?.lead_source,
          ownerId: contact?.lead_owner_id
        });
      } else {
        // Send complete lead data to preserve other fields
        result = await updateCompanyLeadStatus(entityId, { 
          status: newStatus,
          temperature: company?.lead_temperature,
          source: company?.lead_source,
          ownerId: company?.lead_owner_id
        });
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

  const isDropdownDisabled = disabled || isUpdating;

  return (
    <div className="inline-flex flex-col gap-1 relative">
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isDropdownDisabled}>
            {currentStatus ? (
              <Button
                variant="ghost"
                size="sm"
                className={`
                  ${getLeadStatusColor(currentStatus)} 
                  ${getSizeClasses()}
                  transition-all duration-200 
                  border rounded-full
                  h-auto font-medium
                  ${isDropdownDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                  relative z-30
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
                  ${isDropdownDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  border-dashed text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
                  relative z-30
                `}
              >
                <div className="flex items-center gap-2">
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>Add Lead Status</span>
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </div>
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 z-50">
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
                  onClick={() => handleStatusChange(null)}
                  disabled={isUpdating}
                  className="text-red-600 dark:text-red-400"
                >
                  Remove Lead Status
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Show error */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}