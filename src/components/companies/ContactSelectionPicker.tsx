"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X, User, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NewContactModal } from "@/components/contacts/NewContactModal";

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
}

interface ContactSelectionPickerProps {
  selectedContacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  companyData?: {
    name: string;
    type: string;
  };
}

export function ContactSelectionPicker({ 
  selectedContacts, 
  onContactsChange,
  companyData
}: ContactSelectionPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

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
        const response = await fetch(`/api/contacts?q=${encodeURIComponent(term)}`);
        if (response.ok) {
          const contacts = await response.json();
          // Filter out already selected contacts
          const filteredContacts = contacts.filter((contact: Contact) => 
            !selectedContacts.some(selected => selected.id === contact.id)
          );
          setSearchResults(filteredContacts);
        } else {
          console.error('Failed to search contacts');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching contacts:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [selectedContacts]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleAddContact = (contact: Contact) => {
    const updatedContacts = [...selectedContacts, contact];
    onContactsChange(updatedContacts);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveContact = (contactToRemove: Contact) => {
    const updatedContacts = selectedContacts.filter(
      contact => contact.id !== contactToRemove.id
    );
    onContactsChange(updatedContacts);
  };

  const handleNewContactCreated = (createdContact?: Contact) => {
    setShowNewContactModal(false);
    
    // Always add created contact to selected contacts (works for both flows)
    if (createdContact) {
      const updatedContacts = [...selectedContacts, createdContact];
      onContactsChange(updatedContacts);
    }
    
    // Refresh the search results to show the new contact
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  const getContactSecondaryInfo = (contact: Contact) => {
    if (contact.contact_type) return contact.contact_type;
    if (contact.email) return contact.email;
    if (contact.phone) return contact.phone;
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Contacts ({selectedContacts.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.map((contact) => (
              <Badge
                key={contact.id}
                variant="secondary"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 pr-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-32">
                    {getContactDisplayName(contact)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => handleRemoveContact(contact)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Contacts
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts by name, email, phone..."
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
                Searching contacts...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleAddContact(contact)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {getContactDisplayName(contact)}
                        </div>
                        {getContactSecondaryInfo(contact) && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {getContactSecondaryInfo(contact)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="space-y-3">
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No contacts found for "{searchTerm}"
                </div>
                <Separator />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowNewContactModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Contact
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Create New Contact Button (when no search) */}
      {!searchTerm && selectedContacts.length === 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setShowNewContactModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Contact
        </Button>
      )}

      {/* New Contact Modal */}
      <NewContactModal
        isOpen={showNewContactModal}
        onClose={() => setShowNewContactModal(false)}
        onSuccess={handleNewContactCreated}
        companyData={companyData} // Pass company data for inheritance and linking
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