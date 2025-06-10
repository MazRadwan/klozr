"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getEntityTypeColor, getContactEntityType, getCompanyEntityType, getEntityTypeDisplayText } from '@/lib/entityTypeUtils';
import { Building2, Users, Handshake } from 'lucide-react';

interface EntityTypeBadgeProps {
  contact?: {
    type?: string | null;
  };
  company?: {
    type?: string | null;
  };
  // For direct type display (when you have the type already)
  type?: string | null;
  showIcon?: boolean;
  className?: string;
}

export function EntityTypeBadge({ 
  contact, 
  company, 
  type, 
  showIcon = true,
  className = ""
}: EntityTypeBadgeProps) {
  // Determine the type to display - simplified, no inheritance
  const effectiveType = (() => {
    if (type) return type;
    if (company && !contact) {
      const result = getCompanyEntityType(company);
      return result.type;
    }
    if (contact) {
      const result = getContactEntityType(contact);
      return result.type;
    }
    return null;
  })();

  const getTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'lead': return <Users className="h-3 w-3" />;
      case 'customer': return <Building2 className="h-3 w-3" />;
      case 'partner': return <Handshake className="h-3 w-3" />;
      default: return null;
    }
  };

  if (!effectiveType) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center gap-1">
          {showIcon && <span className="text-gray-400">—</span>}
          <span>No Type</span>
        </div>
      </Badge>
    );
  }

  return (
    <Badge className={`${getEntityTypeColor(effectiveType)} transition-all duration-200 cursor-default ${className}`}>
      <div className="flex items-center gap-1">
        {showIcon && getTypeIcon(effectiveType)}
        <span>{getEntityTypeDisplayText(effectiveType)}</span>
      </div>
    </Badge>
  );
}