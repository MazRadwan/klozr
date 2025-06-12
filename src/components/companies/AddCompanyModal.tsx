"use client";

import React, { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactSelectionPicker } from "./ContactSelectionPicker";
import { formatPhone, formatState, formatEmail, isValidEmail } from "@/lib/formatUtils";

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
}

interface Company {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  industry?: string;
  founded?: string;
  employees?: number;
  revenue?: string;
  description?: string;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: Company) => void;
}

const INDUSTRIES = [
  'Technology',
  'Software',
  'Consulting',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Media',
  'Other'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function AddCompanyModal({
  isOpen,
  onClose,
  onCompanyCreated
}: AddCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    postal_code: '',
    industry: '',
    founded: '',
    employees: undefined as number | undefined,
    revenue: '',
    description: '',
    type: '',
    // Lead management fields
    lead_status: '',
    lead_temperature: '',
    lead_source: '',
    lead_assigned_date: '',
    lead_owner_id: undefined as number | undefined
  });
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Formatted input handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    handleInputChange('phone', formatted);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formatted = formatState(e.target.value);
    handleInputChange('state', formatted);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEmail(e.target.value);
    handleInputChange('email', formatted);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.website && formData.website.trim()) {
      const cleanWebsite = formData.website.replace(/^https?:\/\//, '');
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[\w]{2,}$/.test(cleanWebsite)) {
        newErrors.website = "Invalid website format (e.g., example.com)";
      }
    }
    
    if (formData.employees && (formData.employees < 1 || !Number.isInteger(formData.employees))) {
      newErrors.employees = "Employees must be a positive whole number";
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
      const companyData = {
        ...formData,
        website: formData.website?.replace(/^https?:\/\//, '') || undefined,
        employees: formData.employees ? Number(formData.employees) : undefined,
        assignContacts: selectedContacts.map(c => c.id),
        created_at: new Date().toISOString()
      };

      console.log('Creating company with data:', companyData);

      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create company');
      }

      const newCompany = await res.json();
      console.log('Company created successfully:', newCompany);

      // Reset form and close modal
      handleClose();
      onCompanyCreated(newCompany);
    } catch (error) {
      console.error('Error creating company:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create company. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: 'USA',
        postal_code: '',
        industry: '',
        founded: '',
        employees: undefined,
        revenue: '',
        description: '',
        type: '',
        // Lead management fields
        lead_status: '',
        lead_temperature: '',
        lead_source: '',
        lead_assigned_date: '',
        lead_owner_id: undefined
      });
      setSelectedContacts([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Company
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive company profile with contact assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Company Name - Full Width */}
          <div>
            <Label htmlFor="name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={saving}
              placeholder="Enter company name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={saving}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={saving}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  disabled={saving}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  disabled={saving}
                  placeholder="Postal"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                disabled={saving}
                placeholder="contact@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                disabled={saving}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={saving}
              placeholder="example.com"
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-sm text-red-500 mt-1">{errors.website}</p>
            )}
          </div>

          {/* Lower Priority Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="type">Entity Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select type</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div>
              <Label htmlFor="founded">Founded Year</Label>
              <Input
                id="founded"
                value={formData.founded}
                onChange={(e) => handleInputChange('founded', e.target.value)}
                disabled={saving}
                placeholder="e.g., 2015"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employees">Number of Employees</Label>
              <Input
                id="employees"
                type="number"
                min="1"
                value={formData.employees || ''}
                onChange={(e) => handleInputChange('employees', e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={saving}
                placeholder="e.g., 150"
                className={errors.employees ? "border-red-500" : ""}
              />
              {errors.employees && (
                <p className="text-sm text-red-500 mt-1">{errors.employees}</p>
              )}
            </div>
            <div>
              <Label htmlFor="revenue">Annual Revenue</Label>
              <Input
                id="revenue"
                value={formData.revenue}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                disabled={saving}
                placeholder="e.g., $50M"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={saving}
              placeholder="Brief description of the company, its mission, and what they do..."
              className="min-h-[50px] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the company's business, mission, and key services or products.
            </p>
          </div>

          {/* Lead Management Fields - Only shown when type is 'lead' */}
          {formData.type === 'lead' && (
            <div className="space-y-4 p-4 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-blue-800 dark:text-blue-200 font-semibold">Lead Management</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_status">Lead Status</Label>
                  <select
                    id="lead_status"
                    value={formData.lead_status}
                    onChange={(e) => handleInputChange('lead_status', e.target.value)}
                    disabled={saving}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select status</option>
                    <option value="prospect">Prospect</option>
                    <option value="qualified">Qualified</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="customer">Customer</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead_temperature">Lead Temperature</Label>
                  <select
                    id="lead_temperature"
                    value={formData.lead_temperature}
                    onChange={(e) => handleInputChange('lead_temperature', e.target.value)}
                    disabled={saving}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select temperature</option>
                    <option value="cold">Cold</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="lead_source">Lead Source</Label>
                <select
                  id="lead_source"
                  value={formData.lead_source}
                  onChange={(e) => handleInputChange('lead_source', e.target.value)}
                  disabled={saving}
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select source</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="trade_show">Trade Show</option>
                  <option value="social_media">Social Media</option>
                </select>
              </div>

              <div>
                <Label htmlFor="lead_assigned_date">Lead Assigned Date</Label>
                <Input
                  id="lead_assigned_date"
                  type="date"
                  value={formData.lead_assigned_date}
                  onChange={(e) => handleInputChange('lead_assigned_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* Contact Selection */}
          <div className="space-y-2">
            <Label>Assign Contacts</Label>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
              <ContactSelectionPicker
                selectedContacts={selectedContacts}
                onContactsChange={setSelectedContacts}
                companyData={{
                  name: formData.name,
                  type: formData.type,
                  lead_status: formData.lead_status,
                  lead_temperature: formData.lead_temperature,
                  lead_source: formData.lead_source,
                  lead_assigned_date: formData.lead_assigned_date,
                  lead_owner_id: formData.lead_owner_id
                }}
              />
            </div>
          </div>

          <DialogFooter>
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
                'Create Company'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 