"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Eye, Edit, Trash2, Upload, Download, Search, Filter, 
  ChevronUp, ChevronDown, DollarSign, MoreVertical, LayoutGrid, Columns
} from "lucide-react";
import Link from "next/link";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { DealStageDropdown } from "@/components/deals/DealStageDropdown";
import { getDealStageColor } from "@/lib/dealUtils";
import { KanbanBoard } from "@/components/kanban";
import { useViewMode } from "@/hooks/useViewMode";

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_id?: number;
}

interface Company {
  id: number;
  name?: string;
}

interface Offering {
  id: number;
  name?: string;
  type?: string;
}

interface Deal {
  deal: {
    id: number;
    title: string;
    amount?: number;
    stage?: string;
    close_date?: string;
    deal_notes?: string;
    created_at?: string;
  };
  contact?: { 
    id: number;
    first_name?: string; 
    last_name?: string; 
    email?: string; 
  };
  company?: { 
    id: number;
    name?: string; 
  };
  offering?: { 
    id: number;
    name?: string; 
    type?: string; 
  };
}

type SortField = 'title' | 'amount' | 'stage' | 'close_date' | 'created_at' | 'company';
type SortDirection = 'asc' | 'desc';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useViewMode('table');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch("/api/deals");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setDeals(data);
      } else {
        console.error("API returned non-array data:", data);
        setDeals([]);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = useMemo(() => {
    if (!Array.isArray(deals)) {
      return [];
    }
    
    let filtered = deals.filter(deal => {
      const matchesSearch = searchTerm === "" || 
        deal.deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${deal.contact?.first_name} ${deal.contact?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStage = stageFilter === "all" || deal.deal.stage === stageFilter;
      
      return matchesSearch && matchesStage;
    });

    // Sort deals
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.deal.title || '';
          bValue = b.deal.title || '';
          break;
        case 'amount':
          aValue = a.deal.amount || 0;
          bValue = b.deal.amount || 0;
          break;
        case 'stage':
          aValue = a.deal.stage || '';
          bValue = b.deal.stage || '';
          break;
        case 'close_date':
          aValue = a.deal.close_date || '';
          bValue = b.deal.close_date || '';
          break;
        case 'company':
          aValue = a.company?.name || '';
          bValue = b.company?.name || '';
          break;
        case 'created_at':
          aValue = a.deal.created_at || '';
          bValue = b.deal.created_at || '';
          break;
        default:
          aValue = '';
          bValue = '';
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
  }, [deals, searchTerm, stageFilter, sortField, sortDirection]);

  const formatCurrency = (amount?: number) => 
    amount ? `$${amount.toLocaleString()}` : '$0';

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

  // Handle deal updates from stage dropdown
  const handleDealUpdate = (updatedDeal: any) => {
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.deal.id === updatedDeal.id ? {
          deal: {
            id: updatedDeal.id,
            title: updatedDeal.title,
            amount: updatedDeal.amount,
            stage: updatedDeal.stage,
            close_date: updatedDeal.close_date,
            deal_notes: updatedDeal.deal_notes,
            created_at: updatedDeal.created_at,
            updated_at: updatedDeal.updated_at,
          },
          contact: updatedDeal.contact,
          company: updatedDeal.company,
          offering: updatedDeal.offering,
        } : deal
      )
    );
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8 space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Search/Filter Skeleton */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Table Header Skeleton */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
                  <div className="grid grid-cols-7 gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
                {/* Table Rows Skeleton */}
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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
              Deals
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Manage your sales opportunities and pipeline
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
            <Link href="/dashboard/deals/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-xs md:text-sm">
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Add Deal
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="relative flex-1 md:max-w-md lg:max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-none focus:shadow-none hover:shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 flex-1 sm:flex-none"
                >
                  <option value="all">All Stages</option>
                  <option value="Prospecting">Prospecting</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                {/* View mode dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 gap-2 text-gray-700 dark:text-gray-300">
                      {viewMode === 'table' ? (
                        <LayoutGrid className="h-4 w-4" />
                      ) : (
                        <Columns className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline capitalize">
                        {viewMode === 'table' ? 'Table' : 'Board'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      onClick={() => setViewMode('table')} 
                      className={`flex items-center gap-2 text-gray-900 dark:text-gray-100 ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    > 
                      <LayoutGrid className="h-4 w-4" /> 
                      <span>Table view</span>
                      {viewMode === 'table' && <span className="ml-auto text-xs text-blue-600">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setViewMode('kanban')} 
                      className={`flex items-center gap-2 text-gray-900 dark:text-gray-100 ${viewMode === 'kanban' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    > 
                      <Columns className="h-4 w-4" /> 
                      <span>Board view</span>
                      {viewMode === 'kanban' && <span className="ml-auto text-xs text-blue-600">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        <Card className={`${viewMode === 'kanban' ? 'hidden' : 'hidden md:block'} bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-lg`}>
          <CardContent className="p-0">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No deals found</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {searchTerm || stageFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first deal."
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
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          Deal
                          {getSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                        onClick={() => handleSort('company')}
                      >
                        <div className="flex items-center">
                          Company
                          {getSortIcon('company')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                        Contact
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon('amount')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                        onClick={() => handleSort('stage')}
                      >
                        <div className="flex items-center">
                          Stage
                          {getSortIcon('stage')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-gray-100"
                        onClick={() => handleSort('close_date')}
                      >
                        <div className="flex items-center">
                          Close Date
                          {getSortIcon('close_date')}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.map((deal, i) => (
                      <TableRow 
                        key={deal.deal.id}
                        className={`
                          border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer
                          ${i % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-25 dark:bg-gray-950/50'}
                        `}
                        onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}`}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {deal.deal.title.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <Link 
                                href={`/dashboard/deals/${deal.deal.id}`}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                {deal.deal.title}
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {deal.company?.name || 'No company'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-gray-900 dark:text-gray-100">
                            {deal.contact ? (
                              <div>
                                <div className="font-medium">
                                  {deal.contact.first_name} {deal.contact.last_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {deal.contact.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">No contact</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(deal.deal.amount)}
                        </TableCell>
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                          <DealStageDropdown
                            dealId={deal.deal.id}
                            currentStage={deal.deal.stage || 'Prospecting'}
                            onStageUpdate={handleDealUpdate}
                            variant="badge"
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {deal.deal.close_date ? new Date(deal.deal.close_date).toLocaleDateString() : 'TBD'}
                        </TableCell>
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
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
                                onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}/edit`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Add delete functionality here
                                }}
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
            )}
          </CardContent>
        </Card>

        {/* Kanban Board */}
        {viewMode === 'kanban' && (
          <div className="w-full">
            <KanbanBoard searchTerm={searchTerm} stageFilter={stageFilter} />
          </div>
        )}

        {/* Mobile Cards */}
        <div className={`${viewMode === 'kanban' ? 'hidden' : 'block md:hidden'} space-y-4`}>
          {filteredDeals.length === 0 ? (
            <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
              <CardContent className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No deals found</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {searchTerm || stageFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first deal."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDeals.map((deal) => (
              <Card 
                key={deal.deal.id} 
                className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {deal.deal.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {deal.deal.title}
                        </h3>
                        <div className="mt-1 space-y-1">
                                                     <div className="flex items-center justify-between">
                             <DealStageDropdown
                               dealId={deal.deal.id}
                               currentStage={deal.deal.stage || 'Prospecting'}
                               onStageUpdate={handleDealUpdate}
                               variant="badge"
                               size="sm"
                             />
                             <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                               {formatCurrency(deal.deal.amount)}
                             </span>
                           </div>
                          {deal.company?.name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Company:</span> {deal.company.name}
                            </p>
                          )}
                          {deal.contact && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Contact:</span> {deal.contact.first_name} {deal.contact.last_name}
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
                        <DropdownMenuItem onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/dashboard/deals/${deal.deal.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400"
                          onClick={() => {
                            // Add delete functionality here
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
                      {deal.deal.close_date && (
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Close Date:</span> {new Date(deal.deal.close_date).toLocaleDateString()}
                        </div>
                      )}
                      {deal.contact?.email && (
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Email:</span> {deal.contact.email}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        {filteredDeals.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Showing {filteredDeals.length} of {deals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
            {(searchTerm || stageFilter !== "all") && (
              <span className="ml-1">
                (filtered{stageFilter !== "all" && ` by ${stageFilter}`})
              </span>
            )}
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
} 