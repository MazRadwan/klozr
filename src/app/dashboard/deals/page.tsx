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
  ChevronUp, ChevronDown, DollarSign, MoreVertical
} from "lucide-react";
import Link from "next/link";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

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

  const getStageColor = (stage?: string) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      'Qualification': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      'Proposal': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
      'Negotiation': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
      'Closed Won': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      'Closed Lost': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Deals
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your sales opportunities and pipeline
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
            <Link href="/dashboard/deals/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deals by title, company, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-none focus:shadow-none hover:shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Stages</option>
                  <option value="Prospecting">Prospecting</option>
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-lg">
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
                        <TableCell className="py-4">
                          <Badge variant="secondary" className={`${getStageColor(deal.deal.stage)} transition-all duration-200 cursor-default`}>
                            {deal.deal.stage || 'Unknown'}
                          </Badge>
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