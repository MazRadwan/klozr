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
import { ChevronDown, Loader2, Plus, Building2, Users, Handshake } from 'lucide-react';
import { 
  ENTITY_TYPES, 
  EntityType, 
  getEntityTypeColor,
  getContactEntityType,
  getCompanyEntityType,
  updateContactEntityType,
  updateCompanyEntityType,
  getEntityTypeDisplayText
} from '@/lib/entityTypeUtils';

interface EntityTypeDropdownProps {
  entityType: 'contact' | 'company';
  entityId: number;
  contact?: {
    type?: string | null;
  };
  company?: {
    type?: string | null;
  };
  onTypeUpdate?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EntityTypeDropdown({
  entityType,
  entityId,
  contact,
  company,
  onTypeUpdate,
  disabled = false,
  size = 'sm'
}: EntityTypeDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current type - simplified, no inheritance
  const currentType = (() => {
    if (entityType === 'company' && company) {
      const result = getCompanyEntityType(company);
      return result.type;
    } else if (entityType === 'contact' && contact) {
      const result = getContactEntityType(contact);
      return result.type;
    }
    return null;
  })();

  const handleTypeChange = async (newType: EntityType | null) => {
    if (isUpdating || disabled) return;

    setIsUpdating(true);
    setError(null);

    try {
      let result;
      if (entityType === 'contact') {
        result = await updateContactEntityType(entityId, newType);
      } else {
        result = await updateCompanyEntityType(entityId, newType);
      }

      if (!result.success) {
        setError(result.error || 'Failed to update entity type');
      } else {
        onTypeUpdate?.();
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="h-3 w-3" />;
      case 'customer': return <Building2 className="h-3 w-3" />;
      case 'partner': return <Handshake className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isDropdownDisabled}>
          {currentType ? (
            <Button
              variant="ghost"
              size="sm"
              className={`
                ${getEntityTypeColor(currentType)} 
                ${getSizeClasses()}
                transition-all duration-200 
                border rounded-full
                h-auto font-medium
                ${isDropdownDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
              `}
            >
              <div className="flex items-center gap-1">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {getTypeIcon(currentType)}
                    <span>{getEntityTypeDisplayText(currentType)}</span>
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
              `}
            >
              <div className="flex items-center gap-2">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Set Type</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </div>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {ENTITY_TYPES.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => handleTypeChange(type)}
              disabled={type === currentType || isUpdating}
              className={`
                ${type === currentType ? 'bg-gray-100 dark:bg-gray-800' : ''}
                ${isUpdating ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-2 w-full">
                {getTypeIcon(type)}
                <span className="text-sm">{getEntityTypeDisplayText(type)}</span>
                {type === currentType && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          {currentType && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleTypeChange(null)}
                disabled={isUpdating}
                className="text-red-600 dark:text-red-400"
              >
                Clear Type
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Show error */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}