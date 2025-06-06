"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface NewContact {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  contact_type?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
}

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  onSuccess: () => void;
}

export function NewContactModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess
}: NewContactModalProps) {
  const [formData, setFormData] = useState<NewContact>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    contact_type: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof NewContact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      setError('Please fill in the required fields: First Name, Last Name, and Email');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const contactData = {
        ...formData,
        company_id: companyId,
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) {
        throw new Error('Failed to create contact');
      }

      // Reset form and close modal
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type: '',
        address: '',
        city: '',
        state_province: '',
        postal_code: ''
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating contact:', error);
      setError('Failed to create contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact for {companyName}. This contact will be automatically linked to the company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <Input
                id="contact_type"
                value={formData.contact_type}
                onChange={(e) => handleInputChange('contact_type', e.target.value)}
                placeholder="e.g., CEO, Manager"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                value={formData.state_province}
                onChange={(e) => handleInputChange('state_province', e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Contact'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 