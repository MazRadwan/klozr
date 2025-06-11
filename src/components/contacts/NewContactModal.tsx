"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, User } from 'lucide-react';
import { formatPhone, formatState, formatEmail, isValidEmail, isValidPhone } from '@/lib/formatUtils';
import { CompanyPicker } from '@/components/companies/CompanyPicker';

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
  is_primary?: boolean;
  type?: string;
  owner_user_id?: number;
}

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: number;  // Optional when called from contacts page
  companyName?: string;  // Optional when called from contacts page
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
    postal_code: '',
    is_primary: false,
    type: 'lead',
    owner_user_id: undefined
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCompany, setSelectedCompany] = useState<{id: number; name?: string} | null>(
    companyId && companyName ? { id: companyId, name: companyName } : null
  );

  const handleInputChange = (field: keyof NewContact, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: "" }));
    }
  };

  // Formatted input handlers with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleInputChange('phone', formatted);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatState(e.target.value);
    handleInputChange('state_province', formatted);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEmail(e.target.value);
    handleInputChange('email', formatted);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const contactData = {
        ...formData,
        company_id: selectedCompany?.id || null,
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create contact');
      }

      // Reset form and close modal
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating contact:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create contact. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type: '',
        address: '',
        city: '',
        state_province: '',
        postal_code: '',
        is_primary: false,
        type: 'lead',
        owner_user_id: undefined
      });
      setSelectedCompany(companyId && companyName ? { id: companyId, name: companyName } : null);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New Contact
          </DialogTitle>
          <DialogDescription>
            {companyName 
              ? `Add a new contact for ${companyName}. This contact will be automatically linked to the company.`
              : 'Add a new contact to your CRM system. You can optionally assign them to a company.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={saving}
                placeholder="First name"
                className={errors.first_name ? "border-red-500" : ""}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={saving}
                placeholder="Last name"
                className={errors.last_name ? "border-red-500" : ""}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={saving}
              placeholder="Street address"
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
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                value={formData.state_province}
                onChange={handleStateChange}
                disabled={saving}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                disabled={saving}
                placeholder="ZIP/Postal Code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              disabled={saving}
              placeholder="contact@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                disabled={saving}
                placeholder="(555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Entity Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_primary" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary || false}
                  onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                  disabled={saving}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Primary Contact
              </Label>
            </div>
          </div>

          {/* Company Selection - Only show when companyId not provided and not -1 (special flag) */}
          {!companyId && companyId !== -1 && (
            <div className="space-y-2">
              <Label>Company</Label>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
                <CompanyPicker
                  contactId={0} // Will be set after contact creation
                  currentCompany={selectedCompany}
                  onCompanyChange={(company) => setSelectedCompany(company)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 