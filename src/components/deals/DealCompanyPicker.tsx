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

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
}

interface DealCompanyPickerProps {
  dealId: number;
  currentCompany: Company | null;
  currentContact: Contact | null;
  onCompanyUpdate: () => void;
}

export function DealCompanyPicker({ dealId, currentCompany, currentContact, onCompanyUpdate }: DealCompanyPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [companyContacts, setCompanyContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(currentContact);
  const [showContactPicker, setShowContactPicker] = useState(false);

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

  useEffect(() => {
    setSelectedContact(currentContact);
  }, [currentContact]);

  useEffect(() => {
    if (currentCompany) {
      // Don't auto-assign when loading existing company, just fetch contacts
      fetchCompanyContacts(currentCompany.id, false);
    }
  }, [currentCompany]);

  // Fetch contacts for a company
  const fetchCompanyContacts = async (companyId: number, autoAssign: boolean = false) => {
    try {
      const response = await fetch(`/api/contacts?company_id=${companyId}`);
      if (response.ok) {
        const contacts = await response.json();
        setCompanyContacts(contacts);
        
        // Only auto-select if we don't have a current contact and autoAssign is true
        if (autoAssign && !selectedContact && contacts.length > 0) {
          // Auto-select primary contact or first contact
          const primaryContact = contacts.find((c: Contact) => c.is_primary);
          const autoSelectedContact = primaryContact || contacts[0];
          
          setSelectedContact(autoSelectedContact);
          // Auto-assign this contact to the deal
          await handleAssignContact(autoSelectedContact);
        }
      }
    } catch (error) {
      console.error('Error fetching company contacts:', error);
    }
  };

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
        // Fetch contacts for the newly assigned company and auto-assign primary contact
        await fetchCompanyContacts(company.id, true);
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

  const handleAssignContact = async (contact: Contact) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contact.id,
        }),
      });

      if (response.ok) {
        setSelectedContact(contact);
        onCompanyUpdate();
      } else {
        console.error('Failed to assign contact');
      }
    } catch (error) {
      console.error('Error assigning contact:', error);
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

      {/* Contact Section */}
      {currentCompany && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Contact
            </label>
            
            {selectedContact ? (
              <div className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {selectedContact.first_name ? selectedContact.first_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedContact.first_name} {selectedContact.last_name}
                      {selectedContact.is_primary && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    {selectedContact.email && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedContact.email}
                      </div>
                    )}
                  </div>
                </div>
                
                {companyContacts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContactPicker(!showContactPicker)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                No contacts found for this company
              </div>
            )}

            {/* Contact Picker Dropdown */}
            {showContactPicker && companyContacts.length > 1 && (
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Contact ({companyContacts.length})
                    </div>
                    {companyContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          contact.id === selectedContact?.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                        onClick={() => {
                          handleAssignContact(contact);
                          setShowContactPicker(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {contact.first_name ? contact.first_name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {contact.first_name} {contact.last_name}
                              {contact.is_primary && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-1 py-0.5 rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            {contact.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                        {contact.id === selectedContact?.id && (
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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