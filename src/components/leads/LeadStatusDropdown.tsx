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
import { ChevronDown, Loader2, Plus, Info } from 'lucide-react';
import { 
  LEAD_STATUSES, 
  LeadStatus, 
  getLeadStatusColor, 
  getEffectiveLeadStatus,
  updateContactLeadStatus,
  updateCompanyLeadStatus
} from '@/lib/leadUtils';
import { Tooltip } from '@/components/ui/tooltip';

interface LeadStatusDropdownProps {
  entityType: 'contact' | 'company';
  entityId: number;
  contact?: {
    individual_lead_status?: string | null;
    company_id?: number | null;
    company?: { lead_status?: string | null } | null;
    type?: string | null;
  };
  company?: {
    lead_status?: string | null;
  };
  onStatusUpdate?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // New prop to control tooltip behavior in table context
  suppressInheritanceTooltip?: boolean;
}

export function LeadStatusDropdown({
  entityType,
  entityId,
  contact,
  company,
  onStatusUpdate,
  disabled = false,
  size = 'sm',
  suppressInheritanceTooltip = false
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
  
  // Determine if dropdown should be disabled due to inheritance
  const isInheritanceDisabled = entityType === 'contact' && inheritanceInfo.inherited && !disabled;
  const isDropdownDisabled = disabled || isUpdating || isInheritanceDisabled;

  return (
    <div 
      className="inline-flex flex-col gap-1 relative"
    >
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isDropdownDisabled}>
            {currentStatus ? (
              <Tooltip content={isInheritanceDisabled ? "Inherited from company" : "Click to change lead status"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                    ${currentStatus ? getLeadStatusColor(currentStatus) : ''} 
                    ${getSizeClasses()}
                    transition-all duration-200 
                    border rounded-full
                    h-auto font-medium
                    ${isDropdownDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                    ${isInheritanceDisabled ? 'ring-1 ring-blue-300 dark:ring-blue-600' : ''}
                    relative z-30
                  `}
                >
                  <div className="flex items-center gap-1">
                    {isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <span>{currentStatus}</span>
                        {!isInheritanceDisabled && <ChevronDown className="h-3 w-3" />}
                      </>
                    )}
                  </div>
                </Button>
              </Tooltip>
            ) : (
              <Tooltip content="Click to add lead status">
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
              </Tooltip>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 z-50">
            {LEAD_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={status === currentStatus || isUpdating || isInheritanceDisabled}
                className={`
                  ${status === currentStatus ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  ${isUpdating || isInheritanceDisabled ? 'opacity-50' : ''}
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
            {currentStatus && !isInheritanceDisabled && (
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
        
        {/* Inheritance info icon - only show if not suppressed and inherited */}
        {!suppressInheritanceTooltip && isInheritanceDisabled && (
          <div className="relative group">
            <Info 
              className="h-3 w-3 text-gray-400 cursor-help" 
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                Inherited from company
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          </div>
        )}
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