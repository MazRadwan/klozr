"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, DollarSign, Plus, Loader2, User } from 'lucide-react';
import { NewDealModal } from './NewDealModal';

interface Deal {
  id: number;
  title: string;
  amount?: number;
  stage?: string;
  close_date?: string;
  created_at?: string;
  contact?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface DealSearchResult {
  deal: {
    id: number;
    title: string;
    amount?: number;
    stage?: string;
    close_date?: string;
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
}

interface CompanyDealPickerProps {
  companyId: number;
  companyName: string;
  currentDeals: Deal[];
  onDealsUpdate: () => void;
}

export function CompanyDealPicker({ companyId, companyName, currentDeals, onDealsUpdate }: CompanyDealPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DealSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced search for deals
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/deals?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) {
            const results = await res.json();
            // Filter out deals already linked to this company
            const currentDealIds = currentDeals.map(d => d.id);
            const availableDeals = results.filter((deal: DealSearchResult) => 
              !currentDealIds.includes(deal.deal.id)
            );
            setSearchResults(availableDeals);
          }
        } catch (error) {
          console.error('Error searching deals:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, currentDeals]);

  const handleAddDeal = async (deal: DealSearchResult) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/deals/${deal.deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (res.ok) {
        const updatedDeal = await res.json();
        onDealsUpdate();
        // Remove from search results and clear search
        setSearchResults(prev => prev.filter(d => d.deal.id !== deal.deal.id));
        setSearchTerm('');
      } else {
        const errorText = await res.text();
        console.error('Failed to link deal to company:', res.status, errorText);
      }
    } catch (error) {
      console.error('Error linking deal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveDeal = async (deal: Deal) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: null }),
      });

      if (res.ok) {
        const updatedDeal = await res.json();
        onDealsUpdate();
      } else {
        const errorText = await res.text();
        console.error('Failed to unlink deal from company:', res.status, errorText);
      }
    } catch (error) {
      console.error('Error unlinking deal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNewDealCreated = (newDeal: Deal) => {
    onDealsUpdate();
    setShowNewDealModal(false);
  };

  const formatCurrency = (amount?: number) => 
    amount ? `$${amount.toLocaleString()}` : '$0';

  const getStageColor = (stage?: string) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Qualification': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Proposal': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Closed Won': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Closed Lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Current Deals */}
      {currentDeals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Current Deals ({currentDeals.length})
          </h4>
          <div className="space-y-2">
            {currentDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {deal.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(deal.amount)}
                    </span>
                    <Badge variant="secondary" className={`${getStageColor(deal.stage)} text-xs`}>
                      {deal.stage || 'Unknown'}
                    </Badge>
                    {deal.contact && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                          {`${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDeal(deal)}
                  disabled={isUpdating}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Deals */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Link Existing Deal
        </h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search deals by title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Search Results */}
        {searchTerm.length >= 2 && (
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <CardContent className="p-0 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((result) => (
                    <div
                      key={result.deal.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between transition-colors bg-white dark:bg-gray-900"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.deal.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {formatCurrency(result.deal.amount)}
                          </span>
                          <Badge variant="secondary" className={`${getStageColor(result.deal.stage)} text-xs font-medium`}>
                            {result.deal.stage || 'Unknown'}
                          </Badge>
                          {result.contact && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <User className="h-3 w-3" />
                              <span className="truncate">
                                {`${result.contact.first_name || ''} ${result.contact.last_name || ''}`.trim()}
                              </span>
                            </div>
                          )}
                          {result.company && result.company.name && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              • {result.company.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddDeal(result)}
                        disabled={isUpdating}
                        className="ml-3 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                  <DollarSign className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No deals found matching "{searchTerm}"</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowNewDealModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Deal
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create New Deal Button (when no search) */}
      {!searchTerm && (
        <Button
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setShowNewDealModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Deal
        </Button>
      )}

      {/* New Deal Modal */}
      <NewDealModal
        isOpen={showNewDealModal}
        onClose={() => setShowNewDealModal(false)}
        companyId={companyId}
        companyName={companyName}
        onDealCreated={handleNewDealCreated}
      />
    </div>
  );
} 