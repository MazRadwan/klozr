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
  company_id?: number;
}

interface DealContactPickerProps {
  dealId: number;
  currentContact: Contact | null;
  onContactUpdate: () => void;
}

export function DealContactPicker({ dealId, currentContact, onContactUpdate }: DealContactPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          // Filter out the current contact if it exists
          const filteredContacts = contacts.filter((contact: Contact) => 
            !currentContact || contact.id !== currentContact.id
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
    [currentContact]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleAssignContact = async (contact: Contact) => {
    setIsUpdating(true);
    setError(null);
    
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
        onContactUpdate();
        setSearchTerm("");
        setSearchResults([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to assign contact');
        console.error('Failed to assign contact:', errorData);
      }
    } catch (error) {
      setError('Network error occurred while assigning contact');
      console.error('Error assigning contact:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveContact = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: null,
        }),
      });

      if (response.ok) {
        onContactUpdate();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to remove contact');
        console.error('Failed to remove contact:', errorData);
      }
    } catch (error) {
      setError('Network error occurred while removing contact');
      console.error('Error removing contact:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.email || 'Unnamed Contact';
  };

  const handleNewContactCreated = (newContact: any) => {
    // Auto-assign the newly created contact to the deal
    handleAssignContact({
      id: newContact.id,
      first_name: newContact.first_name,
      last_name: newContact.last_name,
      email: newContact.email,
      phone: newContact.phone,
      company_id: newContact.company_id
    });
    setShowNewContactModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <div className="text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}
      {/* Current Contact */}
      {currentContact && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Contact
          </label>
          <Badge
            variant="secondary"
            className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800 flex items-center justify-between w-fit max-w-full"
          >
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getContactDisplayName(currentContact)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              onClick={handleRemoveContact}
              disabled={isUpdating}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentContact ? 'Change Contact' : 'Assign Contact'}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts by name or email..."
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
                    className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleAssignContact(contact)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {contact.first_name ? contact.first_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {getContactDisplayName(contact)}
                        </div>
                        {contact.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignContact(contact);
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
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
      {!searchTerm && !currentContact && (
        <Button
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