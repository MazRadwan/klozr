"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getLeadStatusColor, getEffectiveLeadStatus } from '@/lib/leadUtils';

interface LeadStatusBadgeProps {
  contact?: {
    individual_lead_status?: string | null;
    company_id?: number | null;
    company?: { lead_status?: string | null } | null;
  };
  company?: {
    lead_status?: string | null;
  };
  // For direct status display (when you have the status already)
  status?: string | null;
  showSource?: boolean;
  className?: string;
}

export function LeadStatusBadge({ 
  contact, 
  company, 
  status, 
  showSource = false,
  className = ""
}: LeadStatusBadgeProps) {
  // If direct status is provided, use it
  if (status) {
    return (
      <Badge className={`${getLeadStatusColor(status)} ${className}`}>
        {status}
      </Badge>
    );
  }

  // If company is provided directly
  if (company && !contact) {
    if (!company.lead_status) return null;
    return (
      <Badge className={`${getLeadStatusColor(company.lead_status)} ${className}`}>
        {company.lead_status}
      </Badge>
    );
  }

  // If contact is provided, use hybrid logic
  if (contact) {
    const effective = getEffectiveLeadStatus(contact);
    
    if (!effective.status) return null;

    return (
      <Badge className={`${getLeadStatusColor(effective.status)} ${className}`}>
        {effective.status}
        {showSource && effective.inherited && (
          <span className="ml-1 text-xs opacity-75">
            (from {effective.source})
          </span>
        )}
      </Badge>
    );
  }

  return null;
} 