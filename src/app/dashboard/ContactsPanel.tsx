"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EntityToggle } from '@/components/ui/entity-toggle';
import { LeadStatusBadge, LeadStatusDropdown } from '@/components/leads';

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
  company_id?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  created_at?: string;
  // Lead management fields
  individual_lead_status?: string | null;
  is_lead_contact?: boolean;
  lead_source?: string | null;
  lead_assigned_date?: string | null;
  lead_owner_id?: number | null;
  // Company relation with lead status
  company?: {
    id: number;
    name?: string;
    lead_status?: string | null;
  } | null;
  [key: string]: any;
}

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

type SortField = 'first_name' | 'last_name' | 'email' | 'phone' | 'contact_type' | 'city' | 'state_province' | 'lead_status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ContactsPanel() {
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
  
  // Column management
  const [columns, setColumns] = useState<TableColumn[]>([
    { key: 'name', label: 'Name', sortable: true, visible: true, width: 'w-48' },
    { key: 'email', label: 'Email', sortable: true, visible: true, width: 'w-64' },
    { key: 'phone', label: 'Phone', sortable: true, visible: true, width: 'w-40' },
    { key: 'contact_type', label: 'Type', sortable: true, visible: true, width: 'w-32' },
    { key: 'lead_status', label: 'Lead Status', sortable: true, visible: true, width: 'w-36' },
    { key: 'city', label: 'City', sortable: true, visible: true, width: 'w-32' },
    { key: 'state_province', label: 'State', sortable: true, visible: true, width: 'w-24' },
    { key: 'created_at', label: 'Added', sortable: true, visible: true, width: 'w-32' },
  ]);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({});
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle select all checkbox
  useEffect(() => {
    const allVisible = filteredAndSortedContacts.map(c => c.id);
    const allSelected = allVisible.length > 0 && allVisible.every(id => selectedContacts.includes(id));
    setSelectAll(allSelected);
  }, [selectedContacts, contacts, searchTerm, filterType]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts?include_company=true");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

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
    setSelectedContact(contact);
    setDeleteModalOpen(true);
  };

  const handleAdd = () => {
    setNewContact({});
    setAddModalOpen(true);
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedContact) return;
    
    try {
      const res = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      
      await fetchContacts();
      setDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (e: any) {
      setError(e.message);
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

  const saveNew = async () => {
    if (!newContact.first_name || !newContact.last_name || !newContact.email) {
      setError('Please fill in required fields: First Name, Last Name, and Email');
      return;
    }
    
    try {
      const contactData = {
        ...newContact,
        created_at: new Date().toISOString(),
      };

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (!res.ok) throw new Error('Failed to create contact');
      
      await fetchContacts();
      setAddModalOpen(false);
      setNewContact({});
    } catch (e: any) {
      setError(e.message);
    }
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

  // Column visibility toggle
  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  // Get visible columns
  const visibleColumns = columns.filter(col => col.visible);

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      // If no search term, show all contacts (only apply filter)
      if (!searchTerm.trim()) {
        const matchesFilter = filterType === "all" || contact.contact_type === filterType;
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
      
      const matchesFilter = filterType === "all" || contact.contact_type === filterType;
      
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

  const getContactTypes = () => {
    const types = [...new Set(contacts.map(c => c.contact_type).filter(Boolean))];
    return types;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContactTypeColor = (type?: string) => {
    const colors: { [key: string]: string } = {
      'Decision Maker': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700',
      'Technical Lead': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      'CEO': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
      'VP of Operations': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
      'CTO': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700',
      'Chief Information Officer': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-700',
      'Chief Medical Officer': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      'Managing Partner': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      'IT Director': 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:hover:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
      'Business Development Director': 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700',
      'VP of Technology': 'bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700',
    };
    return colors[type || ''] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
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
      case 'contact_type':
        return contact.contact_type ? (
          <Badge className={`${getContactTypeColor(contact.contact_type)} transition-all duration-200 cursor-default`}>
            {contact.contact_type}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        );
      case 'lead_status':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <LeadStatusDropdown
              entityType="contact"
              entityId={parseInt(contact.id)}
              contact={{
                individual_lead_status: contact.individual_lead_status,
                company_id: contact.company_id ? parseInt(contact.company_id) : null,
                company: contact.company
              }}
              onStatusUpdate={fetchContacts}
              size="sm"
            />
          </div>
        );
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
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-900">
        <AlertTitle className="text-red-800 dark:text-red-400">Error Loading Contacts</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
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

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
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
                {getContactTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              {/* Column Visibility Dropdown - Hidden on mobile */}
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
                    {columns.map(column => (
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
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
        <CardContent className="p-0">
          {filteredAndSortedContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No contacts found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first contact."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all contacts"
                        />
                      </TableHead>
                      {visibleColumns.map(column => (
                        <TableHead 
                          key={column.key}
                          className={`font-semibold text-gray-900 dark:text-gray-100 ${
                            column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors' : ''
                          } ${column.width || ''}`}
                          onClick={() => column.sortable && column.key !== 'name' ? handleSort(column.key as SortField) : column.key === 'name' && handleSort('first_name')}
                        >
                          <div className="flex items-center">
                            {column.label}
                            {column.sortable && getSortIcon(column.key === 'name' ? 'first_name' : column.key as SortField)}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-16 font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedContacts.map((contact, i) => (
                      <TableRow 
                        key={contact.id} 
                        className={`
                          border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer
                          ${selectedContacts.includes(contact.id) ? 'bg-blue-50 dark:bg-blue-950/20' : 
                            i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-25 dark:bg-gray-950/50'}
                        `}
                        onClick={() => handleContactClick(contact.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                            aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                          />
                        </TableCell>
                        {visibleColumns.map(column => (
                          <TableCell key={column.key} className="py-3">
                            {renderCellContent(contact, column.key)}
                          </TableCell>
                        ))}
                        <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDelete(contact)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
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
                                <Badge className={`${getContactTypeColor(contact.contact_type)} text-xs transition-all duration-200 cursor-default`}>
                                  {contact.contact_type}
                                </Badge>
                              )}
                              <div onClick={(e) => e.stopPropagation()}>
                                <LeadStatusDropdown
                                  entityType="contact"
                                  entityId={parseInt(contact.id)}
                                  contact={{
                                    individual_lead_status: contact.individual_lead_status,
                                    company_id: contact.company_id ? parseInt(contact.company_id) : null,
                                    company: contact.company
                                  }}
                                  onStatusUpdate={fetchContacts}
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
                                onClick={() => handleDelete(contact)}
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{selectedContact.first_name} {selectedContact.last_name}</strong>
                {selectedContact.email && ` (${selectedContact.email})`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Contact
            </Button>
          </div>
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
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Add New Contact</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Create a new contact in your CRM system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newContact.first_name || ''}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newContact.last_name || ''}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_type">Contact Type</Label>
                <select
                  id="contact_type"
                  value={newContact.contact_type || ''}
                  onChange={(e) => setNewContact({ ...newContact, contact_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select type</option>
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="Decision Maker">Decision Maker</option>
                  <option value="Technical Lead">Technical Lead</option>
                  <option value="VP of Operations">VP of Operations</option>
                </select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newContact.city || ''}
                  onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  value={newContact.state_province || ''}
                  onChange={(e) => setNewContact({ ...newContact, state_province: e.target.value })}
                  placeholder="CA"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newContact.address || ''}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNew}>
              Create Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
