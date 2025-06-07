"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Building2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NewCompanyModal } from "@/components/companies/NewCompanyModal";

interface Company {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
}

interface DealCompanyPickerProps {
  dealId: number;
  currentCompany: Company | null;
  onCompanyUpdate: () => void;
}

export function DealCompanyPicker({ dealId, currentCompany, onCompanyUpdate }: DealCompanyPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/companies?q=${encodeURIComponent(term)}`);
        if (response.ok) {
          const companies = await response.json();
          // Filter out the current company if it exists
          const filteredCompanies = companies.filter((company: Company) => 
            !currentCompany || company.id !== currentCompany.id
          );
          setSearchResults(filteredCompanies);
        } else {
          console.error('Failed to search companies');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching companies:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [currentCompany]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleAssignCompany = async (company: Company) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: company.id,
        }),
      });

      if (response.ok) {
        onCompanyUpdate();
        setSearchTerm("");
        setSearchResults([]);
      } else {
        console.error('Failed to assign company');
      }
    } catch (error) {
      console.error('Error assigning company:', error);
    }
  };

  const handleRemoveCompany = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: null,
        }),
      });

      if (response.ok) {
        onCompanyUpdate();
      } else {
        console.error('Failed to remove company');
      }
    } catch (error) {
      console.error('Error removing company:', error);
    }
  };

  const handleNewCompanyCreated = (newCompany: Company) => {
    handleAssignCompany(newCompany);
    setShowNewCompanyModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Current Company */}
      {currentCompany && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Company
          </label>
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex items-center justify-between w-fit max-w-full"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{currentCompany.name || 'Unnamed Company'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={handleRemoveCompany}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentCompany ? 'Change Company' : 'Assign Company'}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search companies by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Search Results */}
      {(searchTerm || isSearching) && (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardContent className="p-3">
            {isSearching ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Searching companies...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleAssignCompany(company)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {company.name || 'Unnamed Company'}
                        </div>
                        {(company.email || company.phone) && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {company.email || company.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="space-y-3">
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No companies found for "{searchTerm}"
                </div>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowNewCompanyModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Company
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Create New Company Button (when no search) */}
      {!searchTerm && !currentCompany && (
        <Button
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setShowNewCompanyModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Company
        </Button>
      )}

      {/* New Company Modal */}
      <NewCompanyModal
        isOpen={showNewCompanyModal}
        onClose={() => setShowNewCompanyModal(false)}
        onCompanyCreated={handleNewCompanyCreated}
      />
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 