"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getLeadStatusColor, getContactLeadStatus, getCompanyLeadStatus } from '@/lib/leadUtils';

interface LeadStatusBadgeProps {
  contact?: {
    lead_status?: string | null;
    type?: string | null;
  };
  company?: {
    lead_status?: string | null;
    type?: string | null;
  };
  // For direct status display (when you have the status already)
  status?: string | null;
  className?: string;
}

export function LeadStatusBadge({ 
  contact, 
  company, 
  status, 
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
    const result = getCompanyLeadStatus(company);
    if (!result.shouldShow || !result.status) return null;
    
    return (
      <Badge className={`${getLeadStatusColor(result.status)} ${className}`}>
        {result.status}
      </Badge>
    );
  }

  // If contact is provided
  if (contact) {
    const result = getContactLeadStatus(contact);
    if (!result.shouldShow || !result.status) return null;

    return (
      <Badge className={`${getLeadStatusColor(result.status)} ${className}`}>
        {result.status}
      </Badge>
    );
  }

  return null;
}