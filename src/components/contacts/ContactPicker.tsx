"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Search, X, User, Plus, Loader2 } from 'lucide-react';

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
  company_id?: number;
  created_at?: string;
}

interface ContactPickerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  currentContacts: Contact[];
  onContactsUpdate: () => void;
  onCreateNew: () => void;
}

export function ContactPicker({
  isOpen,
  onClose,
  companyId,
  companyName,
  currentContacts,
  onContactsUpdate,
  onCreateNew
}: ContactPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Search contacts with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/contacts?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) {
            const results = await res.json();
            // Filter out contacts already linked to this company
            const currentContactIds = currentContacts.map(c => c.id);
            const availableContacts = results.filter((contact: Contact) => 
              !currentContactIds.includes(contact.id)
            );
            setSearchResults(availableContacts);
          }
        } catch (error) {
          console.error('Error searching contacts:', error);
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
  }, [searchTerm, currentContacts]);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleAddContact = async (contact: Contact) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (res.ok) {
        onContactsUpdate();
        // Remove from search results
        setSearchResults(prev => prev.filter(c => c.id !== contact.id));
      } else {
        console.error('Failed to link contact to company');
      }
    } catch (error) {
      console.error('Error linking contact:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveContact = async (contact: Contact) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: null }),
      });

      if (res.ok) {
        onContactsUpdate();
      } else {
        console.error('Failed to unlink contact from company');
      }
    } catch (error) {
      console.error('Error unlinking contact:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.email || 'Unnamed Contact';
  };

  const getContactSecondaryInfo = (contact: Contact) => {
    const parts = [];
    if (contact.email) parts.push(contact.email);
    if (contact.contact_type) parts.push(contact.contact_type);
    return parts.join(' • ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Contacts for {companyName}</DialogTitle>
          <DialogDescription>
            Search for existing contacts to link, or create new ones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Current Contacts as Tags */}
          {currentContacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Current Contacts ({currentContacts.length})
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {currentContacts.map((contact) => (
                  <Badge
                    key={contact.id}
                    variant="secondary"
                    className="flex items-center gap-2 pr-1 py-1"
                  >
                    <User className="h-3 w-3" />
                    <span className="text-xs">{getContactDisplayName(contact)}</span>
                    <button
                      onClick={() => handleRemoveContact(contact)}
                      disabled={isUpdating}
                      className="rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Search Existing Contacts
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="space-y-2 flex-1 overflow-hidden">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Search Results
              </h4>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {getContactDisplayName(contact)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {getContactSecondaryInfo(contact)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddContact(contact)}
                          disabled={isUpdating}
                          className="text-xs"
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
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No contacts found matching "{searchTerm}"</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Contact
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 