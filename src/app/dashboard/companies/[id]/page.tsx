"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ClientDashboardLayout } from '@/components/layout/ClientDashboardLayout';
import { ContactPicker } from '@/components/contacts/ContactPicker';
import { NewContactModal } from '@/components/contacts/NewContactModal';
import { CompanyDealPicker } from '@/components/deals/CompanyDealPicker';
import { EntityTypeDropdown } from '@/components/entityTypes/EntityTypeDropdown';
import { LeadStatusDropdown, LeadTemperatureDropdown } from '@/components/leads';
import { ActivityFeed, CreateActivityModal } from '@/components/activities';
import { 
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Users, 
  DollarSign, Calendar, MessageSquare, PhoneCall, Video, 
  FileText, Edit, Trash2, UserPlus, Plus, MoreHorizontal, ExternalLink, Check
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  formatPhone, formatPostalCode, formatEmail, formatWebsite,
  isValidPhone, isValidPostalCode, isValidEmail, isValidWebsite, 
  isValidFoundedYear, isValidEmployeeCount 
} from '@/lib/formatUtils';

interface Company {
  id: number;
  name?: string;
  type?: string | null;
  lead_status?: string | null;
  lead_temperature?: string | null;
  lead_source?: string | null;
  lead_owner_id?: number | null;
  lead_assigned_date?: string | null;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  employees?: number;
  revenue?: string;
  founded?: string;
  description?: string;
  created_at?: string;
}


interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
  company_id?: number;
  owner_user_id?: number;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  is_primary?: boolean;
  created_at?: string;
  avatar?: string;
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [newContactModalOpen, setNewContactModalOpen] = useState(false);
  
  // Activity states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'call' | 'email' | 'note' | 'meeting' | 'task'>('note');
  
  // Activity refresh functionality
  const refreshActivityFeedRef = useRef<(() => void) | null>(null);
  
  // Edit states
  const [isEditingDeals, setIsEditingDeals] = useState(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);
  const [editingCompanyData, setEditingCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    founded: '',
    industry: '',
    description: '',
    employees: '',
    revenue: ''
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  // Validate form when editing starts or data changes
  useEffect(() => {
    if (isEditingCompanyInfo) {
      validateAllCompanyFields();
    }
  }, [isEditingCompanyInfo, editingCompanyData]);

  const fetchCompanyData = async () => {
    console.log('📊 fetchCompanyData called for company:', companyId);
    setLoading(true);
    try {
      // Fetch company data from API
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      const companyData = await res.json();



      // Fetch real contacts for this company
      const contactsRes = await fetch(`/api/contacts?company_id=${companyId}`);
      let realContacts: Contact[] = [];
      if (contactsRes.ok) {
        realContacts = await contactsRes.json();
      }

      // Fetch real deals for this company
      console.log('🎯 Fetching deals for company:', companyId);
      const dealsRes = await fetch(`/api/deals?company_id=${companyId}`);
      let realDeals: any[] = [];
      if (dealsRes.ok) {
        realDeals = await dealsRes.json();
        console.log('📈 Fetched deals:', realDeals);
      } else {
        console.error('❌ Failed to fetch deals:', dealsRes.status);
      }

      setCompany(companyData);
      setContacts(realContacts);
      setDeals(realDeals);
      console.log('✅ Updated deals state with:', realDeals.length, 'deals');
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleContactManagement = () => {
    setContactPickerOpen(true);
  };

  const handleCreateNewContact = () => {
    setContactPickerOpen(false);
    setNewContactModalOpen(true);
  };

  const handleContactsUpdate = () => {
    fetchCompanyData();
  };

  const handleDealsUpdate = () => {
    console.log('🔄 handleDealsUpdate called, refetching company data...');
    fetchCompanyData();
  };

  const handleCancelDealsEdit = () => {
    setIsEditingDeals(false);
  };

  const handleEditCompanyInfo = () => {
    if (!company) return;
    
    setEditingCompanyData({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.postal_code || '',
      country: company.country || '',
      founded: company.founded || '',
      industry: company.industry || '',
      description: company.description || '',
      employees: company.employees?.toString() || '',
      revenue: company.revenue || ''
    });
    setIsEditingCompanyInfo(true);
  };

  const handleSaveCompanyInfo = async () => {
    if (!company) return;
    
    // Validate all fields before saving
    if (!validateAllCompanyFields()) {
      return; // Don't save if validation fails
    }
    
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCompanyData),
      });

      if (response.ok) {
        await fetchCompanyData();
        setIsEditingCompanyInfo(false);
      } else {
        console.error('Failed to update company');
      }
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleCancelCompanyInfoEdit = () => {
    setIsEditingCompanyInfo(false);
  };

  // Quick action handlers
  const handleQuickAction = (type: 'call' | 'email' | 'note' | 'meeting' | 'task') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
  };


  const getIndustryColor = (industry?: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Software': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      'Consulting': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Healthcare': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Finance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    };
    return colors[industry || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  // Validation functions for company
  const validateCompanyField = (field: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (field) {
      case 'name':
        if (!value.trim()) errors.name = 'Company name is required';
        break;
      case 'email':
        if (value && !isValidEmail(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !isValidPhone(value)) {
          errors.phone = 'Phone number must be 10 digits in format (###) ###-####';
        }
        break;
      case 'website':
        if (value && !isValidWebsite(value)) {
          errors.website = 'Please enter a valid website URL';
        }
        break;
      case 'postal_code':
        if (value && !isValidPostalCode(value)) {
          errors.postal_code = 'Postal code must be valid US (12345 or 12345-1234) or Canadian (A1A 1A1) format';
        }
        break;
      case 'city':
        if (value && !/^[a-zA-Z\s\-'\.]+$/.test(value)) {
          errors.city = 'City must contain only letters, spaces, hyphens, apostrophes, and periods';
        }
        break;
      case 'founded':
        if (value && !isValidFoundedYear(value)) {
          errors.founded = 'Founded year must be a 4-digit year between 1800 and current year';
        }
        break;
      case 'employees':
        if (value && !isValidEmployeeCount(value)) {
          errors.employees = 'Employee count must be a positive number';
        }
        break;
    }
    
    return errors;
  };

  const validateAllCompanyFields = () => {
    const allErrors: {[key: string]: string} = {};
    
    // Validate all fields
    Object.entries(editingCompanyData).forEach(([field, value]) => {
      const fieldErrors = validateCompanyField(field, typeof value === 'string' ? value : '');
      Object.assign(allErrors, fieldErrors);
    });
    
    setValidationErrors(allErrors);
    const isValid = Object.keys(allErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleCompanyDataChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Apply formatting
    switch (field) {
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'postal_code':
        formattedValue = formatPostalCode(value);
        break;
      case 'email':
        formattedValue = formatEmail(value);
        break;
      case 'website':
        formattedValue = formatWebsite(value);
        break;
    }
    
    // Update the data
    setEditingCompanyData({...editingCompanyData, [field]: formattedValue});
    
    // Validate the field
    const fieldErrors = validateCompanyField(field, formattedValue);
    setValidationErrors(prev => {
      const updated = {...prev};
      if (fieldErrors[field]) {
        updated[field] = fieldErrors[field];
      } else {
        delete updated[field];
      }
      return updated;
    });
    
    // Update form validity
    const allErrors = {...validationErrors, ...fieldErrors};
    if (!fieldErrors[field]) delete allErrors[field];
    setIsFormValid(Object.keys(allErrors).length === 0);
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

  const breadcrumbItems = [
    { label: "Companies", href: "/dashboard/companies" },
    { label: company?.name || "Company", current: true }
  ];

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!company) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              Company not found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The company you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/companies')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">
        {/* Back Button + Breadcrumbs in single row */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - with increased top spacing and proper alignment */}
        <div className="pt-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="max-w-none">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {company.name}
                </h1>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <EntityTypeDropdown
                    entityType="company"
                    entityId={company.id}
                    company={{
                      type: company.type
                    }}
                    onTypeUpdate={fetchCompanyData}
                    size="sm"
                  />
                  {/* Lead Status - Only show for leads */}
                  {company.type === 'lead' && (
                    <LeadStatusDropdown
                      entityType="company"
                      entityId={company.id}
                      company={{
                        lead_status: company.lead_status,
                        lead_temperature: company.lead_temperature,
                        lead_source: company.lead_source,
                        lead_owner_id: company.lead_owner_id,
                        type: company.type
                      }}
                      onStatusUpdate={fetchCompanyData}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {company.industry && (
                  <Badge className={`${getIndustryColor(company.industry)} transition-all duration-200 cursor-default`}>
                    {company.industry}
                  </Badge>
                )}
                {company.employees && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {company.employees.toLocaleString()} employees
                  </span>
                )}
                {company.revenue && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {company.revenue} revenue
                  </span>
                )}
              </div>
              {company.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
                  {company.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleContactManagement}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Contacts
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Deal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 dark:text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Company
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-w-screen-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Company Information
              </CardTitle>
              <div className="flex gap-2">
                {!isEditingCompanyInfo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCompanyInfo}
                    className="opacity-100"
                  >
                    <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingCompanyInfo ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Company Name */}
                    <div className="md:col-span-12">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Company Name *
                      </label>
                      <Input
                        value={editingCompanyData.name}
                        onChange={(e) => handleCompanyDataChange('name', e.target.value)}
                        placeholder="Company name"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.name ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                      )}
                    </div>

                    {/* Address Row */}
                    <div className="md:col-span-8">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Address
                      </label>
                      <Input
                        value={editingCompanyData.address}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, address: e.target.value})}
                        placeholder="Street address"
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        City
                      </label>
                      <Input
                        value={editingCompanyData.city}
                        onChange={(e) => handleCompanyDataChange('city', e.target.value)}
                        placeholder="City"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.city ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                      )}
                    </div>

                    {/* State / Postal / Country */}
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        State
                      </label>
                      <Input
                        value={editingCompanyData.state}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, state: e.target.value})}
                        placeholder="State"
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Postal Code
                      </label>
                      <Input
                        value={editingCompanyData.postal_code}
                        onChange={(e) => handleCompanyDataChange('postal_code', e.target.value)}
                        placeholder="12345 or A1A 1A1"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.postal_code ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.postal_code && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.postal_code}</p>
                      )}
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Country
                      </label>
                      <Input
                        value={editingCompanyData.country}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, country: e.target.value})}
                        placeholder="Country"
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Contact Row */}
                    <div className="md:col-span-5">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={editingCompanyData.email}
                        onChange={(e) => handleCompanyDataChange('email', e.target.value)}
                        placeholder="Email address"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone
                      </label>
                      <Input
                        value={editingCompanyData.phone}
                        onChange={(e) => handleCompanyDataChange('phone', e.target.value)}
                        placeholder="(###) ###-####"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.phone ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Website
                      </label>
                      <Input
                        value={editingCompanyData.website}
                        onChange={(e) => handleCompanyDataChange('website', e.target.value)}
                        placeholder="https://example.com"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.website ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.website && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.website}</p>
                      )}
                    </div>

                    {/* Business Metrics Row */}
                    <div className="md:col-span-5">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Industry
                      </label>
                      <Input
                        value={editingCompanyData.industry}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, industry: e.target.value})}
                        placeholder="Industry"
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Founded
                      </label>
                      <Input
                        value={editingCompanyData.founded}
                        onChange={(e) => handleCompanyDataChange('founded', e.target.value)}
                        placeholder="YYYY"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.founded ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.founded && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.founded}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Employees
                      </label>
                      <Input
                        type="number"
                        value={editingCompanyData.employees}
                        onChange={(e) => handleCompanyDataChange('employees', e.target.value)}
                        placeholder="100"
                        className={`text-gray-900 dark:text-gray-100 ${validationErrors.employees ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {validationErrors.employees && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.employees}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Revenue
                      </label>
                      <Input
                        value={editingCompanyData.revenue}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, revenue: e.target.value})}
                        placeholder="Annual revenue"
                        className="text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-12">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </label>
                      <textarea
                        value={editingCompanyData.description}
                        onChange={(e) => setEditingCompanyData({...editingCompanyData, description: e.target.value})}
                        placeholder="Company description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelCompanyInfoEdit}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveCompanyInfo}
                      disabled={!isFormValid}
                      className={`${!isFormValid ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'} text-white`}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <a 
                          href={`mailto:${company.email}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {company.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <a 
                          href={`tel:${company.phone}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {company.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                        <a 
                          href={`https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {(company.address || company.city || company.state || company.postal_code || company.country) && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {[company.address, company.city, company.state, company.postal_code, company.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {company.founded && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Founded</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{company.founded}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Contacts and Lead Management - Side by side layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Sub-Column: Key Contacts */}
            <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Key Contacts ({contacts.length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={handleContactManagement}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Contacts
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm">No contacts found for this company.</p>
                      <p className="text-xs mt-1">Click "Manage Contacts" to add existing contacts or create new ones.</p>
                    </div>
                  ) : (
                    contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {contact.avatar || `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                            </p>
                            {contact.is_primary && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.contact_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Sub-Column: Lead Management - Only show for leads */}
            {company.type === 'lead' && (
              <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <MessageSquare className="h-5 w-5" />
                    Lead Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lead Status and Temperature - Side by side */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Lead Status
                      </label>
                      <LeadStatusDropdown
                        entityType="company"
                        entityId={company.id}
                        company={{
                          lead_status: company.lead_status,
                          lead_temperature: company.lead_temperature,
                          lead_source: company.lead_source,
                          lead_owner_id: company.lead_owner_id,
                          type: company.type
                        }}
                        onStatusUpdate={fetchCompanyData}
                        size="sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Lead Temperature
                      </label>
                      <LeadTemperatureDropdown
                        entityType="company"
                        entityId={company.id}
                        company={{
                          lead_status: company.lead_status,
                          lead_temperature: company.lead_temperature,
                          lead_source: company.lead_source,
                          lead_owner_id: company.lead_owner_id,
                          type: company.type
                        }}
                        onTemperatureUpdate={fetchCompanyData}
                        size="sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lead Source
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {company.lead_source 
                          ? company.lead_source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : 'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lead Owner
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {company.lead_owner_id 
                          ? `Owner #${company.lead_owner_id}`
                          : 'Not assigned'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lead Assigned Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-gray-100">
                          {company.lead_assigned_date 
                            ? new Date(company.lead_assigned_date).toLocaleDateString()
                            : 'Not assigned'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Related Deals */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Related Deals ({deals.length})
                </div>
              </CardTitle>
              {isEditingDeals ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDeals(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDeals(true)}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingDeals ? (
                /* Edit Mode - Show Deal Management */
                <div className="space-y-4">
                  <CompanyDealPicker
                    companyId={parseInt(companyId)}
                    companyName={company?.name || 'Company'}
                    currentDeals={deals.map(d => ({
                      id: d.deal.id,
                      title: d.deal.title,
                      amount: d.deal.amount,
                      stage: d.deal.stage,
                      close_date: d.deal.close_date,
                      created_at: d.deal.created_at,
                      contact: d.contact ? {
                        id: d.contact.id,
                        first_name: d.contact.first_name,
                        last_name: d.contact.last_name,
                        email: d.contact.email
                      } : undefined
                    }))}
                    onDealsUpdate={handleDealsUpdate}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelDealsEdit}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Read-Only Mode - Show Deal List */
                deals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">No deals associated with this company yet.</p>
                    <p className="text-xs mt-1">Click "Manage" to add existing deals or create new ones.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deals.map((dealItem) => (
                      <div
                        key={dealItem.deal.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/dashboard/deals/${dealItem.deal.id}`}
                              className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
                            >
                              {dealItem.deal.title}
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Amount: <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(dealItem.deal.amount)}
                                </span>
                              </span>
                              <Badge variant="secondary" className={`${getStageColor(dealItem.deal.stage)} transition-all duration-200 cursor-default`}>
                                {dealItem.deal.stage || 'Unknown'}
                              </Badge>
                              {dealItem.deal.close_date && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  Close: {new Date(dealItem.deal.close_date).toLocaleDateString()}
                                </span>
                              )}
                              {dealItem.contact && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  Contact: {dealItem.contact.first_name} {dealItem.contact.last_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Icon Bar */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-gray-100 text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('call')}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800"
                >
                  <PhoneCall className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('email')}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <Mail className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('note')}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900/20 dark:hover:text-gray-400 hover:border-gray-200 dark:hover:border-gray-800"
                >
                  <FileText className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('meeting')}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800"
                >
                  <Video className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDeals(true)}
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400 hover:border-yellow-200 dark:hover:border-yellow-800"
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          {session?.user?.id && (
            <ActivityFeed
              entityType="company"
              entityId={company.id}
              userId={parseInt(session.user.id)}
              showQuickActions={false}
              onRefresh={(refreshFn) => { refreshActivityFeedRef.current = refreshFn; }}
              className=""
            />
          )}
        </div>
      </div>

      {/* Contact Picker Modal */}
      <ContactPicker
        isOpen={contactPickerOpen}
        onClose={() => setContactPickerOpen(false)}
        companyId={parseInt(companyId)}
        companyName={company?.name || 'Company'}
        currentContacts={contacts}
        onContactsUpdate={handleContactsUpdate}
        onCreateNew={handleCreateNewContact}
      />

      {/* New Contact Modal */}
      <NewContactModal
        isOpen={newContactModalOpen}
        onClose={() => setNewContactModalOpen(false)}
        companyId={parseInt(companyId)}
        companyName={company?.name || 'Company'}
        onSuccess={handleContactsUpdate}
      />
      </div>
    </ClientDashboardLayout>
  );
} 