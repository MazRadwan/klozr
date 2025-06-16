"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  StickyTable,
  StickyTableTable,
  StickyTableHeader,
  StickyTableBody,
  StickyTableRow,
  StickyTableHead,
  StickyTableCell,
} from "@/components/ui/sticky-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, ChevronUp, ChevronDown, Upload, Download, UserPlus, 
  Trash2, Settings, Mail, Phone, MapPin, User, Eye, MoreVertical,
  Columns
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';

import { Checkbox } from '@/components/ui/checkbox';
import { EntityToggle } from '@/components/ui/entity-toggle';
import { LeadStatusBadge, LeadStatusDropdown, LeadTemperatureDropdown } from '@/components/leads';
import { EntityTypeBadge, EntityTypeDropdown } from '@/components/entityTypes';
import { getContactEntityType, ENTITY_TYPES, getEntityTypeDisplayText } from '@/lib/entityTypeUtils';
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { NewContactModal } from "@/components/contacts/NewContactModal";
import { useColumnManager } from "@/hooks/useColumnManager";

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string; // Job title - descriptive field
  company_id?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  created_at?: string;
  // Entity type classification (primary segmentation)
  type?: string | null; // 'lead' | 'customer' | 'partner'
  // Lead management fields
  lead_status?: string | null;
  lead_temperature?: string | null;
  individual_lead_status?: string | null;
  is_lead_contact?: boolean;
  lead_source?: string | null;
  lead_assigned_date?: string | null;
  lead_owner_id?: number | null;
  // Company relation with lead status and type
  company?: {
    id: number;
    name?: string;
    lead_status?: string | null;
    type?: string | null; // 'lead' | 'customer' | 'partner'
    lead_source?: string | null;
    lead_temperature?: string | null;
    lead_owner_id?: number | null;
  } | null;
  [key: string]: any;
}

// Default column configuration for contacts
const DEFAULT_CONTACTS_COLUMNS = [
  { key: 'checkbox', label: 'Select', sortable: false, visible: true, width: '48px', sticky: 'left' as const },
  { key: 'name', label: 'Name', sortable: true, visible: true, width: '200px' },
  { key: 'email', label: 'Email', sortable: true, visible: true, width: '220px' },
  { key: 'phone', label: 'Phone', sortable: true, visible: true, width: '140px' },
  { key: 'entity_type', label: 'Entity Type', sortable: true, visible: true, width: '120px' },
  { key: 'contact_type', label: 'Job Title', sortable: true, visible: true, width: '150px' },
  { key: 'lead_status', label: 'Lead Status', sortable: true, visible: true, width: '140px' },
  { key: 'lead_source', label: 'Lead Source', sortable: true, visible: true, width: '130px' },
  { key: 'lead_temperature', label: 'Temperature', sortable: true, visible: true, width: '120px' },
  { key: 'lead_owner', label: 'Lead Owner', sortable: true, visible: false, width: '120px' },
  { key: 'city', label: 'City', sortable: true, visible: true, width: '120px' },
  { key: 'state_province', label: 'State', sortable: true, visible: true, width: '100px' },
  { key: 'created_at', label: 'Added', sortable: true, visible: true, width: '120px' },
  { key: 'actions', label: 'Actions', sortable: false, visible: true, width: '80px', sticky: 'right' as const },
];

type SortField = 'first_name' | 'last_name' | 'email' | 'phone' | 'contact_type' | 'city' | 'state_province' | 'lead_status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ContactsPageOld() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Selection state
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Column management with enhanced hook
  const {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    updateColumnWidth,
    calculateStickyOffset
  } = useColumnManager({
    storageKey: 'contacts-table-columns',
    defaultColumns: DEFAULT_CONTACTS_COLUMNS
  });
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({});
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  
  // Delete modal states
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Request management flags similar to CompaniesPage
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchContactsRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Cleanup when component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      fetchContactsRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle select all checkbox
  useEffect(() => {
    const allVisible = filteredAndSortedContacts.map(c => c.id);
    const allSelected = allVisible.length > 0 && allVisible.every(id => selectedContacts.includes(id));
    setSelectAll(allSelected);
  }, [selectedContacts, contacts, searchTerm, filterType]);

  async function fetchContacts() {
    if (isRefreshing) {
      console.log("Skipping fetch - already refreshing");
      return;
    }

    // Abort any in-flight request
    fetchContactsRef.current?.abort();
    fetchContactsRef.current = new AbortController();

    setIsRefreshing(true);
    setLoading(true);

    let aborted = false;
    try {
      const res = await fetch("/api/contacts?include_company=true", {
        signal: fetchContactsRef.current.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
    } catch (e: any) {
      if (e.name === "AbortError") {
        aborted = true; // skip resetting loading state
      } else {
        console.error("Fetch error:", e);
        setError(e.message);
      }
    } finally {
      if (!aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }

  // Debounced version to be reused by dropdowns / edits, mirroring CompaniesPage
  const debouncedFetchContacts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchContacts();
    }, 300);
  }, []);

  // CRUD Operations
  const handleContactClick = (contactId: string) => {
    router.push(`/dashboard/contacts/${contactId}`);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact(contact);
    setEditModalOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    // Only handle state cleanup if not already closing
    if (deleteModalOpen) {
      setDeleteModalOpen(false);
      setContactToDelete(null);
      setIsDeleting(false);
      setError(null); // Clear any previous errors
    }
  };

  const handleAdd = () => {
    setAddModalOpen(true);
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    
    setIsDeleting(true);
    setError(null); // Clear any existing errors
    
    try {
      console.log('Deleting contact:', contactToDelete.id);
      const res = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete contact' }));
        throw new Error(errorData.error || 'Failed to delete contact');
      }
      
      console.log('Contact deleted successfully, closing dialog...');
      
      // Store the contact ID before clearing state
      const deletedContactId = contactToDelete.id;
      
      // Clear all dialog-related state first
      setDeleteModalOpen(false);
      setContactToDelete(null);
      setIsDeleting(false);
      
      // Use setTimeout to ensure dialog cleanup completes before other updates
      setTimeout(() => {
        // Clear selection if deleted contact was selected
        setSelectedContacts(prev => 
          prev.filter(id => id !== deletedContactId.toString())
        );
        
        // Refresh list in background
        fetchContacts();
        console.log('Delete operation completed');
      }, 100);
      
    } catch (e: any) {
      console.error('Delete error:', e);
      setError(e.message);
      // Keep modal open on error so user can see the error and retry
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected contacts
      await Promise.all(
        selectedContacts.map(id => 
          fetch(`/api/contacts/${id}`, { method: 'DELETE' })
        )
      );
      
      await fetchContacts();
      setSelectedContacts([]);
      setBulkDeleteModalOpen(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveEdit = async () => {
    if (!selectedContact || !editingContact) return;
    
    try {
      const res = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingContact),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      
      await fetchContacts();
      setEditModalOpen(false);
      setSelectedContact(null);
      setEditingContact({});
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleContactCreated = () => {
    debouncedFetchContacts();
  };

  // Handle individual contact selection
  const handleContactSelect = (contactId: string, checked: boolean) => {
    setSelectedContacts(prev => 
      checked 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      const allVisible = filteredAndSortedContacts.map(c => c.id);
      setSelectedContacts(allVisible);
    } else {
      setSelectedContacts([]);
    }
  };

  // Legacy support - these are now handled by the useColumnManager hook

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      // If no search term, show all contacts (only apply filter)
      if (!searchTerm.trim()) {
        const matchesFilter = filterType === "all" || contact.type === filterType;
        return matchesFilter;
      }
      
      // Search across all fields, handling null/undefined values
      const searchFields = [
        contact.first_name, contact.last_name, contact.email, 
        contact.phone, contact.city, contact.state_province
      ];
      
      const matchesSearch = searchFields.some(field =>
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesFilter = filterType === "all" || contact.type === filterType;
      
      return matchesSearch && matchesFilter;
    });

    // Sort contacts
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      if (sortField === 'first_name' || sortField === 'last_name') {
        aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim();
      } else {
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [contacts, searchTerm, filterType, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const getEntityTypes = () => {
    // Return all available entity types to ensure partner is always shown
    return ENTITY_TYPES;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderCellContent = (contact: Contact, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}
              </div>
            </div>
          </div>
        );
             case 'email':
         return contact.email ? (
           <a 
             href={`mailto:${contact.email}`} 
             className="text-blue-600 dark:text-blue-400 hover:underline"
             onClick={(e) => e.stopPropagation()}
           >
             {contact.email}
           </a>
         ) : (
           <span className="text-gray-400">—</span>
         );
       case 'phone':
         return contact.phone ? (
           <a 
             href={`tel:${contact.phone}`} 
             className="text-blue-600 dark:text-blue-400 hover:underline"
             onClick={(e) => e.stopPropagation()}
           >
             {contact.phone}
           </a>
         ) : (
           <span className="text-gray-400">—</span>
         );
      case 'entity_type':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <EntityTypeDropdown
              entityType="contact"
              entityId={parseInt(contact.id)}
              contact={{
                type: contact.type
              }}
              onTypeUpdate={debouncedFetchContacts}
              size="sm"
            />
          </div>
        );
             case 'contact_type':
         return contact.contact_type ? (
           <span className="text-gray-900 dark:text-gray-100">{contact.contact_type}</span>
         ) : (
           <span className="text-gray-400">—</span>
         );
      case 'lead_status': {
        // Only show lead status for entities with type 'lead'
        const contactType = getContactEntityType({ type: contact.type });
        if (contactType.type !== 'lead') {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <LeadStatusDropdown
              entityType="contact"
              entityId={parseInt(contact.id)}
              contact={{
                lead_status: contact.lead_status,
                lead_temperature: contact.lead_temperature,
                lead_source: contact.lead_source,
                lead_owner_id: contact.lead_owner_id,
                type: contact.type,
              }}
              onStatusUpdate={debouncedFetchContacts}
              size="sm"
            />
          </div>
        );
      }
      case 'lead_source': {
        // Only show lead source for entities with type 'lead'
        const sourceContactType = getContactEntityType({ type: contact.type });
        if (sourceContactType.type !== 'lead') {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        const leadSource = contact.lead_source;
        return leadSource ? (
          <span className="text-gray-900 dark:text-gray-100 text-sm">
            {leadSource
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
      case 'lead_temperature': {
        // Only show lead temperature for entities with type 'lead'
        const tempContactType = getContactEntityType({ type: contact.type });
        if (tempContactType.type !== 'lead') {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <LeadTemperatureDropdown
              entityType="contact"
              entityId={parseInt(contact.id)}
              contact={{
                lead_status: contact.lead_status,
                lead_temperature: contact.lead_temperature,
                lead_source: contact.lead_source,
                lead_owner_id: contact.lead_owner_id,
                type: contact.type,
              }}
              onTemperatureUpdate={debouncedFetchContacts}
              size="sm"
            />
          </div>
        );
      }
      case 'lead_owner': {
        // Only show lead owner for entities with type 'lead'
        const ownerContactType = getContactEntityType({ type: contact.type });
        if (ownerContactType.type !== 'lead') {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        const ownerId = contact.lead_owner_id;
        return ownerId ? (
          <span className="text-gray-900 dark:text-gray-100 text-sm">Owner #{ownerId}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
      case 'city':
        return contact.city ? (
          <span className="text-gray-900 dark:text-gray-100">{contact.city}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      case 'state_province':
        return contact.state_province ? (
          <span className="text-gray-900 dark:text-gray-100">{contact.state_province}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      case 'created_at':
        return <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(contact.created_at)}</span>;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-900">
            <AlertTitle className="text-red-800 dark:text-red-400">Error Loading Contacts</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Contacts
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage your business contacts and relationships
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-xs md:text-sm">
              <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-xs md:text-sm">
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-xs md:text-sm" onClick={handleAdd}>
            <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Sticky Filters and Search */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 pb-6">
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <EntityToggle />
              <div className="relative flex-1 md:max-w-md lg:max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-none focus:shadow-none hover:shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 flex-1 sm:flex-none"
                >
                  <option value="all">All Types</option>
                  {getEntityTypes().map((type: string) => (
                    <option key={type} value={type}>{getEntityTypeDisplayText(type)}</option>
                  ))}
                </select>
                
                {/* Column Visibility Dropdown */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        <Columns className="h-4 w-4 mr-2" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {columns.filter(col => col.key !== 'checkbox' && col.key !== 'actions').map(column => (
                        <DropdownMenuCheckboxItem
                          key={column.key}
                          checked={column.visible}
                          onCheckedChange={() => toggleColumnVisibility(column.key)}
                        >
                          {column.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Bulk Actions Bar */}
      {selectedContacts.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hidden md:block">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedContacts([])}
                  className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table/Cards */}
      <div className="hidden md:block">
        <StickyTable height="calc(100vh - 320px)" className="shadow-sm">
          <StickyTableTable>
            <StickyTableHeader>
              <StickyTableRow className="border-gray-200 dark:border-gray-800 hover:bg-transparent">
                <StickyTableHead 
                  sticky="left" 
                  stickyOffset={0}
                  className="w-12 pl-6"
                >
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all contacts"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </StickyTableHead>
                {visibleColumns.filter(col => col.key !== 'checkbox' && col.key !== 'actions').map(column => {
                  const sortField = column.key === 'name' ? 'first_name' : 
                                  column.key === 'email' ? 'email' :
                                  column.key === 'phone' ? 'phone' :
                                  column.key === 'contact_type' ? 'contact_type' :
                                  column.key === 'city' ? 'city' :
                                  column.key === 'state_province' ? 'state_province' :
                                  column.key === 'lead_status' ? 'lead_status' :
                                  column.key === 'created_at' ? 'created_at' : null;
                  
                  return (
                    <StickyTableHead 
                      key={column.key}
                      className={`${column.sortable && sortField ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''}`}
                      onClick={() => column.sortable && sortField && handleSort(sortField as SortField)}
                      style={{ width: column.width }}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        {column.label}
                        {column.sortable && sortField && getSortIcon(sortField as SortField)}
                      </div>
                    </StickyTableHead>
                  );
                })}
                
                {/* Sticky Actions Header */}
                <StickyTableHead 
                  sticky="right" 
                  stickyOffset={0}
                  className="w-16 pr-6"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Actions</span>
                </StickyTableHead>
              </StickyTableRow>
            </StickyTableHeader>
            <StickyTableBody>
              {filteredAndSortedContacts.map((contact, i) => (
                <StickyTableRow 
                  key={contact.id} 
                  className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors group"
                  onClick={() => handleContactClick(contact.id)}
                  data-state={selectedContacts.includes(contact.id) ? 'selected' : undefined}
                >
                  <StickyTableCell 
                    sticky="left" 
                    stickyOffset={0}
                    className="pl-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                      aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </StickyTableCell>
                  {visibleColumns.filter(col => col.key !== 'checkbox' && col.key !== 'actions').map(column => (
                    <StickyTableCell 
                      key={column.key} 
                      className="py-3"
                      style={{ width: column.width }}
                      onClick={['entity_type', 'lead_status', 'lead_temperature'].includes(column.key) ? (e) => e.stopPropagation() : undefined}
                    >
                      {renderCellContent(contact, column.key)}
                    </StickyTableCell>
                  ))}
                  {/* Sticky Actions Cell */}
                  <StickyTableCell 
                    sticky="right" 
                    stickyOffset={0}
                    className="pr-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close dropdown menu first, then open dialog after a brief delay
                            setTimeout(() => {
                              handleDelete(contact);
                            }, 0);
                          }}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </StickyTableCell>
                </StickyTableRow>
              ))}
            </StickyTableBody>
          </StickyTableTable>
        </StickyTable>
      </div>

        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="p-0">
                {/* Mobile Bulk Actions */}
                {selectedContacts.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedContacts.length} selected
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedContacts([])}
                          className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 h-7"
                        >
                          Clear
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleBulkDelete}
                          className="text-xs px-3 py-1 h-7"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-4">
                  {filteredAndSortedContacts.map((contact, i) => (
                    <div 
                      key={contact.id}
                      className={`
                        border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors cursor-pointer
                        ${selectedContacts.includes(contact.id) 
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-700' 
                          : 'bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        }
                      `}
                      onClick={() => handleContactClick(contact.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                              aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                            />
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}
                            </h3>
                                                         <div className="flex flex-wrap gap-2 mt-1">
                               {contact.contact_type && (
                                 <span className="text-sm text-gray-600 dark:text-gray-400">
                                   {contact.contact_type}
                                 </span>
                               )}
                              <div onClick={(e) => e.stopPropagation()}>
                                <EntityTypeDropdown
                                  entityType="contact"
                                  entityId={parseInt(contact.id)}
                                  contact={{
                                    type: contact.type
                                  }}
                                  onTypeUpdate={debouncedFetchContacts}
                                  size="sm"
                                />
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <LeadStatusDropdown
                                  entityType="contact"
                                  entityId={parseInt(contact.id)}
                                  contact={{
                                    lead_status: contact.lead_status,
                                    lead_temperature: contact.lead_temperature,
                                    lead_source: contact.lead_source,
                                    lead_owner_id: contact.lead_owner_id,
                                    type: contact.type
                                  }}
                                  onStatusUpdate={debouncedFetchContacts}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Close dropdown menu first, then open dialog after a brief delay
                                  setTimeout(() => {
                                    handleDelete(contact);
                                  }, 0);
                                }}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                                              <div className="space-y-2">
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                              <a 
                                href={`tel:${contact.phone}`} 
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}
                        {(contact.city || contact.state_province) && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {[contact.city, contact.state_province].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {contact.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Added {formatDate(contact.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedContacts.length === 0 && !loading && (
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No contacts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first contact."
              }
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={handleAdd}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {filteredAndSortedContacts.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Showing {filteredAndSortedContacts.length} of {contacts.length} contacts
        </div>
      )}



      {/* Edit Contact Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editingContact.first_name || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editingContact.last_name || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, last_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingContact.phone || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_type">Contact Type</Label>
                <Input
                  id="contact_type"
                  value={editingContact.contact_type || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, contact_type: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editingContact.address || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editingContact.city || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  value={editingContact.state_province || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, state_province: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Modal */}
      <Dialog 
        open={deleteModalOpen} 
        onOpenChange={(open) => {
          // Only call handleDeleteCancel if dialog is being closed
          if (!open) {
            handleDeleteCancel();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contactToDelete?.first_name} {contactToDelete?.last_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Contacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete {selectedContacts.length} Contact{selectedContacts.length > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <NewContactModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleContactCreated}
      />
        </div>
      </div>
    </ClientDashboardLayout>
  );
}
