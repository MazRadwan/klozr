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
  Trash2
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

  useEffect(() => {
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
    fetchContacts();
  }, []);

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
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/30">
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Contacts</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/30">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Companies</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Set(contacts.map(c => c.company_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/30">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">With Email</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {contacts.filter(c => c.email).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/30">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">With Phone</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {contacts.filter(c => c.phone).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="all">All Types</option>
                {getContactTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
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
    </div>
  );
}
