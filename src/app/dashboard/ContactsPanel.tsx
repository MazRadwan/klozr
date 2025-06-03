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
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User,
  UserPlus,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Minus,
  Plus
} from "lucide-react";

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
  [key: string]: any;
}

type SortField = 'first_name' | 'last_name' | 'email' | 'contact_type' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({});
  const [newContact, setNewContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
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
  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setViewModalOpen(true);
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

  const confirmDelete = async () => {
    if (!selectedContact) return;
    
    try {
      const res = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      
      // Refresh contacts list
      await fetchContacts();
      setDeleteModalOpen(false);
      setSelectedContact(null);
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
      
      // Refresh contacts list
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
      // Generate a unique ID for the new contact
      const contactData = {
        ...newContact,
        id: `contact-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      if (!res.ok) throw new Error('Failed to create contact');
      
      // Refresh contacts list
      await fetchContacts();
      setAddModalOpen(false);
      setNewContact({});
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter((contact) => {
      const matchesSearch = searchTerm === "" || 
        `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.phone}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === "all" || contact.contact_type === filterType;
      
      return matchesSearch && matchesFilter;
    });

    // Sort contacts
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
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
      'Decision Maker': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      'Technical Lead': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'CEO': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'VP of Operations': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'CTO': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
    return colors[type || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Contacts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your business contacts and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={handleAdd}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Collapsible Statistics Section */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overview</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
            >
              {showMetrics ? (
                <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </Button>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showMetrics ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Contacts</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{contacts.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Companies</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {new Set(contacts.map(c => c.company_id).filter(Boolean)).size}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">With Email</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {contacts.filter(c => c.email).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">With Phone</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {contacts.filter(c => c.phone).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                {getContactTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-lg">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                      onClick={() => handleSort('first_name')}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon('first_name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                      onClick={() => handleSort('contact_type')}
                    >
                      <div className="flex items-center">
                        Type
                        {getSortIcon('contact_type')}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Contact Info</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Location</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Added
                        {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedContacts.map((contact, i) => (
                    <TableRow 
                      key={contact.id} 
                      className={`
                        border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors
                        ${i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-25 dark:bg-gray-950/50'}
                      `}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {contact.contact_type && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContactTypeColor(contact.contact_type)}`}>
                            {contact.contact_type}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3 mr-2" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3 mr-2" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {(contact.city || contact.state_province) && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3 w-3 mr-2" />
                            {[contact.city, contact.state_province].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(contact.created_at)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                            onClick={() => handleView(contact)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                            onClick={() => handleEdit(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => handleDelete(contact)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {filteredAndSortedContacts.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Showing {filteredAndSortedContacts.length} of {contacts.length} contacts
        </div>
      )}

      {/* View Contact Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              View detailed information about this contact.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</Label>
                  <p className="text-gray-900 dark:text-gray-100">{`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Type</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.contact_type || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.city || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">State/Province</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.state_province || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</Label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.postal_code || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Modal */}
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
              <p className="text-gray-900 dark:text-gray-100">
                <strong>{`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim()}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedContact.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact with their information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_first_name">First Name *</Label>
                <Input
                  id="new_first_name"
                  value={newContact.first_name || ''}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_last_name">Last Name *</Label>
                <Input
                  id="new_last_name"
                  value={newContact.last_name || ''}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_email">Email *</Label>
                <Input
                  id="new_email"
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_phone">Phone</Label>
                <Input
                  id="new_phone"
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new_contact_type">Contact Type</Label>
                <Input
                  id="new_contact_type"
                  value={newContact.contact_type || ''}
                  onChange={(e) => setNewContact({ ...newContact, contact_type: e.target.value })}
                  placeholder="e.g., Decision Maker, CEO, CTO"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_address">Address</Label>
                <Input
                  id="new_address"
                  value={newContact.address || ''}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_city">City</Label>
                <Input
                  id="new_city"
                  value={newContact.city || ''}
                  onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="new_state_province">State/Province</Label>
                <Input
                  id="new_state_province"
                  value={newContact.state_province || ''}
                  onChange={(e) => setNewContact({ ...newContact, state_province: e.target.value })}
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            * Required fields
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNew} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
