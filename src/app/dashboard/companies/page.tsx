"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { useRouter } from "next/navigation";
import { 
  Search, ChevronUp, ChevronDown, Upload, Download, Plus,
  Building2, User, Globe, Phone, Mail, MapPin, MoreVertical, Trash2, Columns
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EntityToggle } from '@/components/ui/entity-toggle';
import { CompanyEditModal } from '@/components/companies/CompanyEditModal';
import { AddCompanyModal } from '@/components/companies/AddCompanyModal';
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { LeadStatusBadge, LeadStatusDropdown, LeadTemperatureDropdown } from '@/components/leads';
import { EntityTypeBadge, EntityTypeDropdown } from '@/components/entityTypes';
import { ENTITY_TYPES, getEntityTypeDisplayText } from '@/lib/entityTypeUtils';

interface Company {
  id: string;
  name?: string;
  industry?: string; // Descriptive field
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  employees?: number;
  revenue?: string;
  founded?: string;
  description?: string;
  created_at?: string;
  // Entity type classification (primary segmentation)
  type?: string | null; // 'lead' | 'customer' | 'partner'
  // Lead management fields
  lead_status?: string | null;
  lead_temperature?: string | null;
  lead_source?: string | null;
  lead_assigned_date?: string | null;
  lead_owner_id?: number | null;
  [key: string]: any;
}

type SortField = 'name' | 'industry' | 'city' | 'state' | 'employees' | 'lead_status' | 'lead_temperature' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Column definition for visibility toggle
interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Selection state
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  
  // Request management
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs for cleanup
  const fetchCompaniesRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Column visibility management
  const [columnsState, setColumnsState] = useState<TableColumn[]>([
    { key: 'industry', label: 'Industry', visible: true },
    { key: 'website', label: 'Website', visible: true },
    { key: 'contact', label: 'Contact', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'employees', label: 'Employees', visible: true },
  ]);

  const isVisible = (key: string) => columnsState.find(c => c.key === key)?.visible;

  const toggleColumnVisibility = (key: string) => {
    setColumnsState(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchCompaniesRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Fetch companies from database
  async function fetchCompanies() {
    if (isRefreshing) {
      console.log('Skipping fetch - already refreshing');
      return;
    }
    
    // Cancel previous request
    fetchCompaniesRef.current?.abort();
    fetchCompaniesRef.current = new AbortController();
    
    setIsRefreshing(true);
    setLoading(true);
    let aborted = false;
    try {
      console.log('Fetching companies...');
      const res = await fetch("/api/companies", {
        signal: fetchCompaniesRef.current.signal
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
      console.log('Companies fetched successfully');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        aborted = true;
      } else {
        console.error('Fetch error:', e);
        setError(e.message);
      }
    } finally {
      if (!aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }

  // Debounced version with proper cleanup
  const debouncedFetchCompanies = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Debounced fetch triggered');
      fetchCompanies();
    }, 300);
  }, []); // No dependencies - stable reference

  const handleCompanyClick = (companyId: string) => {
    router.push(`/dashboard/companies/${companyId}`);
  };

  const handleAddCompany = () => {
    setAddModalOpen(true);
  };

  const handleCompanyCreated = (company: any) => {
    debouncedFetchCompanies();
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditing(true);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    // Only handle state cleanup if not already closing
    if (deleteModalOpen) {
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
      setIsDeleting(false);
      setError(null); // Clear any previous errors
    }
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    
    setIsDeleting(true);
    setError(null); // Clear any existing errors
    
    try {
      console.log('Deleting company:', companyToDelete.id);
      const res = await fetch(`/api/companies/${companyToDelete.id}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete company' }));
        throw new Error(errorData.error || 'Failed to delete company');
      }
      
      console.log('Company deleted successfully, closing dialog...');
      
      // Store the company ID before clearing state
      const deletedCompanyId = companyToDelete.id;
      
      // Clear all dialog-related state first
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
      setIsDeleting(false);
      
      // Use setTimeout to ensure dialog cleanup completes before other updates
      setTimeout(() => {
        // Clear selection if deleted company was selected
        setSelectedCompanies(prev => 
          prev.filter(id => id !== deletedCompanyId.toString())
        );
        
        // Refresh list in background
        fetchCompanies();
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

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log('Bulk deleting companies:', selectedCompanies);
      
      // Delete all selected companies
      const deletePromises = selectedCompanies.map(companyId =>
        fetch(`/api/companies/${companyId}`, {
          method: 'DELETE',
        })
      );
      
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(res => !res.ok);
      
      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} companies`);
      }
      
      console.log('Bulk delete completed successfully');
      
      // Clear all state
      setBulkDeleteModalOpen(false);
      setSelectedCompanies([]);
      setSelectAll(false);
      setIsDeleting(false);
      
      // Refresh list
      setTimeout(() => {
        fetchCompanies();
        console.log('Bulk delete operation completed');
      }, 100);
      
    } catch (e: any) {
      console.error('Bulk delete error:', e);
      setError(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCompany = async (companyData: any) => {
    try {
      if (isEditing && selectedCompany) {
        // Update existing company
        const res = await fetch(`/api/companies/${selectedCompany.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData),
        });
        if (!res.ok) throw new Error('Failed to update company');
      } else {
        // Create new company
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData),
        });
        if (!res.ok) throw new Error('Failed to create company');
      }
      
      await fetchCompanies(); // Refresh the list (keep direct call for save operations)
    } catch (e: any) {
      setError(e.message);
      throw e; // Re-throw to let the modal handle the error
    }
  };

  // Handle individual company selection
  const handleCompanySelect = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => {
      const newSelection = checked 
        ? [...prev, companyId]
        : prev.filter(id => id !== companyId);
      
      // Update selectAll state based on whether all visible companies are selected
      const allVisibleIds = filteredAndSortedCompanies.map(c => c.id);
      const allSelected = allVisibleIds.every(id => newSelection.includes(id));
      setSelectAll(allSelected);
      
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      const allVisible = filteredAndSortedCompanies.map(c => c.id);
      setSelectedCompanies(allVisible);
      setSelectAll(true);
    } else {
      setSelectedCompanies([]);
      setSelectAll(false);
    }
  };

  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const matchesSearch = !searchTerm.trim() || [
        company.name, company.industry, company.city, company.state
      ].some(field => 
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesType = filterType === "all" || company.type === filterType;
      
      return matchesSearch && matchesType;
    });

    // Sort companies
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
  }, [companies, searchTerm, filterType, sortField, sortDirection]);

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
            <AlertTitle className="text-red-800 dark:text-red-400">Error Loading Companies</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Companies
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage your business accounts and company relationships
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
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-xs md:text-sm"
            onClick={handleAddCompany}
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Add Company
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
                placeholder="Search companies..."
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

              {/* Column Visibility Dropdown - hidden on mobile */}
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
                    {columnsState.map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={col.visible}
                        onCheckedChange={() => toggleColumnVisibility(col.key)}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection Actions */}
      {selectedCompanies.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCompanies.length} compan{selectedCompanies.length > 1 ? 'ies' : 'y'} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCompanies([]);
                    setSelectAll(false);
                  }}
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

      {/* Desktop Table */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none hidden md:block">
        <CardContent className="p-0">
          <div className="relative">
            {/* Scrollable Table Container */}
            <div className="overflow-x-auto">
              <Table className="relative">
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800 hover:bg-transparent">
                    <TableHead className="sticky left-0 w-12 pl-6 bg-white dark:bg-gray-950 shadow-[8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_8px_-8px_rgba(0,0,0,0.3)] z-20">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Company Name
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">Entity Type</TableHead>
                    {isVisible('industry') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('industry')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Industry
                        {getSortIcon('industry')}
                      </div>
                    </TableHead>)}
                    {isVisible('website') && (
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">Website</TableHead>)}
                    {isVisible('contact') && (
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">Contact</TableHead>)}
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('lead_status')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Lead Status
                        {getSortIcon('lead_status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('lead_temperature')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Lead Temperature
                        {getSortIcon('lead_temperature')}
                      </div>
                    </TableHead>
                    {isVisible('location') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('city')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Location
                        {getSortIcon('city')}
                      </div>
                    </TableHead>)}
                    {isVisible('employees') && (
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">Employees</TableHead>)}
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-950"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                        Added
                        {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    {/* Sticky Actions Header */}
                    <TableHead className="sticky right-0 w-12 pr-6 bg-white dark:bg-gray-950 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.3)] z-40">
                      <span className="sr-only">Actions</span>
                    </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCompanies.map((company) => (
                <TableRow 
                  key={company.id} 
                  className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                  onClick={() => handleCompanyClick(company.id)}
                >
                  <TableCell className="sticky left-0 pl-6 bg-white dark:bg-gray-950 shadow-[8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_8px_-8px_rgba(0,0,0,0.3)] z-10 group-hover:bg-gray-50 dark:group-hover:bg-gray-900/50 transition-colors">
                    <Checkbox
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={(checked) => handleCompanySelect(company.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {company.name || 'Unnamed Company'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <EntityTypeDropdown
                      entityType="company"
                      entityId={parseInt(company.id)}
                      company={{
                        type: company.type
                      }}
                      onTypeUpdate={debouncedFetchCompanies}
                      size="sm"
                    />
                  </TableCell>
                  {isVisible('industry') && (
                  <TableCell className="py-4">
                    {company.industry ? (
                      <span className="text-gray-900 dark:text-gray-100">{company.industry}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>)}
                  {isVisible('website') && (
                  <TableCell className="py-4">
                    {company.website ? (
                      <a 
                        href={`https://${company.website}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>)}
                  {isVisible('contact') && (
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      {company.email && (
                        <a 
                          href={`mailto:${company.email}`} 
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {company.email}
                        </a>
                      )}
                      {company.phone && (
                        <a 
                          href={`tel:${company.phone}`} 
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {company.phone}
                        </a>
                      )}
                    </div>
                  </TableCell>)}
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    {company.type === 'lead' ? (
                      <LeadStatusDropdown
                        entityType="company"
                        entityId={parseInt(company.id)}
                        company={{
                          lead_status: company.lead_status,
                          lead_temperature: company.lead_temperature,
                          lead_source: company.lead_source,
                          lead_owner_id: company.lead_owner_id,
                          type: company.type
                        }}
                        onStatusUpdate={debouncedFetchCompanies}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    {company.type === 'lead' ? (
                      <LeadTemperatureDropdown
                        entityType="company"
                        entityId={parseInt(company.id)}
                        company={{
                          lead_status: company.lead_status,
                          lead_temperature: company.lead_temperature,
                          lead_source: company.lead_source,
                          lead_owner_id: company.lead_owner_id,
                          type: company.type
                        }}
                        onTemperatureUpdate={debouncedFetchCompanies}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </TableCell>
                  {isVisible('location') && (
                  <TableCell className="py-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-gray-100">
                        {company.city && company.state ? `${company.city}, ${company.state}` : 
                         company.city || company.state || <span className="text-gray-400">—</span>}
                      </div>
                    </div>
                  </TableCell>)}
                  {isVisible('employees') && (
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {company.employees ? company.employees.toLocaleString() : <span className="text-gray-400">—</span>}
                    </span>
                  </TableCell>)}
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(company.created_at)}
                    </span>
                  </TableCell>
                  {/* Sticky Actions Cell */}
                  <TableCell className="sticky right-0 pr-6 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.3)] bg-white dark:bg-gray-950 z-40">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                          <User className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close dropdown menu first, then open dialog after a brief delay
                            setTimeout(() => {
                              handleDeleteClick(company);
                            }, 0);
                          }}
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
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {filteredAndSortedCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCompanyClick(company.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Checkbox
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={(checked) => handleCompanySelect(company.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-gray-300 dark:border-gray-600"
                  />
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {company.name || 'Unnamed Company'}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <EntityTypeDropdown
                            entityType="company"
                            entityId={parseInt(company.id)}
                            company={{
                              type: company.type
                            }}
                            onTypeUpdate={debouncedFetchCompanies}
                            size="sm"
                          />
                        </div>
                        {company.industry && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {company.industry}
                          </span>
                        )}
                        {company.type === 'lead' && (
                          <>
                            <div onClick={(e) => e.stopPropagation()}>
                              <LeadStatusDropdown
                                entityType="company"
                                entityId={parseInt(company.id)}
                                company={{
                                  lead_status: company.lead_status,
                                  lead_temperature: company.lead_temperature,
                                  lead_source: company.lead_source,
                                  lead_owner_id: company.lead_owner_id,
                                  type: company.type
                                }}
                                onStatusUpdate={debouncedFetchCompanies}
                                size="sm"
                              />
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <LeadTemperatureDropdown
                                entityType="company"
                                entityId={parseInt(company.id)}
                                company={{
                                  lead_status: company.lead_status,
                                  lead_temperature: company.lead_temperature,
                                  lead_source: company.lead_source,
                                  lead_owner_id: company.lead_owner_id,
                                  type: company.type
                                }}
                                onTemperatureUpdate={debouncedFetchCompanies}
                                size="sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      {company.city && company.state && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {company.city}, {company.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                      <User className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Close dropdown menu first, then open dialog after a brief delay
                        setTimeout(() => {
                          handleDeleteClick(company);
                        }, 0);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-4 text-sm">
                  {company.email && (
                    <a 
                      href={`mailto:${company.email}`} 
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {company.email}
                    </a>
                  )}
                  {company.phone && (
                    <a 
                      href={`tel:${company.phone}`} 
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {company.phone}
                    </a>
                  )}
                  {company.website && (
                    <a 
                      href={`https://${company.website}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      {company.website}
                    </a>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                  <span>{company.employees ? `${company.employees.toLocaleString()} employees` : ''}</span>
                  <span>Added {formatDate(company.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedCompanies.length === 0 && !loading && (
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No companies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm ? 'Try adjusting your search or filters.' : 'Get started by adding your first company.'}
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={handleAddCompany}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Company Edit Modal */}
      <CompanyEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveCompany}
        company={selectedCompany}
        isEditing={isEditing}
      />

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* Delete Confirmation Modal */}
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
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              className="text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Companies</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCompanies.length} compan{selectedCompanies.length > 1 ? 'ies' : 'y'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete} 
              className="text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedCompanies.length} Compan${selectedCompanies.length > 1 ? 'ies' : 'y'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ClientDashboardLayout>
  );
} 