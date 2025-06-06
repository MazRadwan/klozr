"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Select component removed - using native select instead

interface Company {
  id?: string;
  name?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  employees?: number;
  revenue?: string;
  founded?: string;
  description?: string;
}

interface CompanyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
  company?: Company | null;
  isEditing?: boolean;
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

export function CompanyEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  company, 
  isEditing = false 
}: CompanyEditModalProps) {
  const [formData, setFormData] = useState<Company>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (company && isEditing) {
        setFormData(company);
      } else {
        setFormData({
          name: '',
          industry: '',
          website: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          country: 'USA',
          employees: undefined,
          revenue: '',
          founded: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, company, isEditing]);

  const handleInputChange = (field: keyof Company, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.website && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(formData.website.replace(/^https?:\/\//, ''))) {
      // Allow websites with or without protocol
      const cleanWebsite = formData.website.replace(/^https?:\/\//, '');
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(cleanWebsite)) {
        newErrors.website = 'Invalid website format (e.g., example.com)';
      }
    }
    
    if (formData.employees && (formData.employees < 1 || !Number.isInteger(formData.employees))) {
      newErrors.employees = 'Employees must be a positive whole number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Clean website URL (remove protocol if present, we'll add https:// in display)
      const cleanedData = {
        ...formData,
        website: formData.website?.replace(/^https?:\/\//, ''),
        employees: formData.employees ? Number(formData.employees) : undefined
      };
      
      await onSave(cleanedData);
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Company' : 'Add New Company'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the company information below.'
              : 'Fill in the details to add a new company to your CRM.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter company name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Industry */}
          <div>
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              value={formData.industry || ''}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* Founded */}
          <div>
            <Label htmlFor="founded">Founded Year</Label>
            <Input
              id="founded"
              value={formData.founded || ''}
              onChange={(e) => handleInputChange('founded', e.target.value)}
              placeholder="e.g., 2015"
            />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="example.com"
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@company.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Employees */}
          <div>
            <Label htmlFor="employees">Number of Employees</Label>
            <Input
              id="employees"
              type="number"
              min="1"
              value={formData.employees || ''}
              onChange={(e) => handleInputChange('employees', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 150"
              className={errors.employees ? 'border-red-500' : ''}
            />
            {errors.employees && <p className="text-sm text-red-500 mt-1">{errors.employees}</p>}
          </div>

          {/* Revenue */}
          <div>
            <Label htmlFor="revenue">Annual Revenue</Label>
            <Input
              id="revenue"
              value={formData.revenue || ''}
              onChange={(e) => handleInputChange('revenue', e.target.value)}
              placeholder="e.g., $50M"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Business Ave"
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="San Francisco"
            />
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              value={formData.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the company, its mission, and what they do..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe the company's business, mission, and key services or products.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Company' : 'Add Company')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 