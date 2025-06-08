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
import { useRouter } from "next/navigation";
import { 
  Search, ChevronUp, ChevronDown, Upload, Download, Plus,
  Building2, User, Globe, Phone, Mail, MapPin, MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EntityToggle } from '@/components/ui/entity-toggle';
import { CompanyEditModal } from '@/components/companies/CompanyEditModal';
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { LeadStatusBadge, LeadStatusDropdown } from '@/components/leads';
import { EntityTypeBadge, EntityTypeDropdown } from '@/components/entityTypes';

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

type SortField = 'name' | 'industry' | 'city' | 'state' | 'employees' | 'lead_status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Selection state
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch companies from database
  async function fetchCompanies() {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCompanyClick = (companyId: string) => {
    router.push(`/dashboard/companies/${companyId}`);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsEditing(false);
    setEditModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditing(true);
    setEditModalOpen(true);
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete company');
      
      await fetchCompanies(); // Refresh the list
    } catch (e: any) {
      setError(e.message);
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
      
      await fetchCompanies(); // Refresh the list
    } catch (e: any) {
      setError(e.message);
      throw e; // Re-throw to let the modal handle the error
    }
  };

  // Handle individual company selection
  const handleCompanySelect = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => 
      checked 
        ? [...prev, companyId]
        : prev.filter(id => id !== companyId)
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      const allVisible = filteredAndSortedCompanies.map(c => c.id);
      setSelectedCompanies(allVisible);
    } else {
      setSelectedCompanies([]);
    }
  };

  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const matchesSearch = !searchTerm.trim() || [
        company.name, company.industry, company.city, company.state
      ].some(field => 
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesIndustry = filterIndustry === "all" || company.industry === filterIndustry;
      
      return matchesSearch && matchesIndustry;
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
  }, [companies, searchTerm, filterIndustry, sortField, sortDirection]);

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

  const getIndustries = () => {
    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
    return industries;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getIndustryColor = (industry?: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      'Software': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700',
      'Consulting': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
      'Healthcare': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
      'Finance': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      'Financial Services': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      'Manufacturing': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
      'Energy': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      'Retail': 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700',
    };
    return colors[industry || ''] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
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
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 flex-1 sm:flex-none"
              >
                <option value="all">All Industries</option>
                {getIndustries().map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-800 hover:bg-transparent">
                <TableHead className="w-12 pl-6">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                    Company Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Entity Type</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => handleSort('industry')}
                >
                  <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                    Industry
                    {getSortIcon('industry')}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Website</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Contact</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => handleSort('lead_status')}
                >
                  <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                    Lead Status
                    {getSortIcon('lead_status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                    Location
                    {getSortIcon('city')}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Employees</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100">
                    Added
                    {getSortIcon('created_at')}
                  </div>
                </TableHead>
                <TableHead className="w-12 pr-6">
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
                  <TableCell className="pl-6">
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
                      onTypeUpdate={fetchCompanies}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    {company.industry ? (
                      <Badge className={`${getIndustryColor(company.industry)} transition-all duration-200 cursor-default`}>
                        {company.industry}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
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
                  </TableCell>
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
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    {company.type === 'lead' ? (
                      <LeadStatusDropdown
                        entityType="company"
                        entityId={parseInt(company.id)}
                        company={{
                          lead_status: company.lead_status
                        }}
                        onStatusUpdate={fetchCompanies}
                        size="sm"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-gray-100">
                        {company.city && company.state ? `${company.city}, ${company.state}` : 
                         company.city || company.state || <span className="text-gray-400">—</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {company.employees ? company.employees.toLocaleString() : <span className="text-gray-400">—</span>}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(company.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6">
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
                          onClick={() => handleDeleteCompany(company.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                            onTypeUpdate={fetchCompanies}
                            size="sm"
                          />
                        </div>
                        {company.industry && (
                          <Badge className={`${getIndustryColor(company.industry)} text-xs transition-all duration-200 cursor-default`}>
                            {company.industry}
                          </Badge>
                        )}
                        {company.type === 'lead' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <LeadStatusDropdown
                              entityType="company"
                              entityId={parseInt(company.id)}
                              company={{
                                lead_status: company.lead_status
                              }}
                              onStatusUpdate={fetchCompanies}
                              size="sm"
                            />
                          </div>
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
                      onClick={() => handleDeleteCompany(company.id)}
                    >
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
    </div>
    </ClientDashboardLayout>
  );
} 