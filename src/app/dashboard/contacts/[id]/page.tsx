"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { 
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, 
  DollarSign, ExternalLink, User, Globe, Edit, Trash2, Save, X, MessageSquare,
  FileText, CheckSquare
} from "lucide-react";
import { 
  formatPhone, formatPostalCode, formatEmail, 
  isValidPhone, isValidPostalCode, isValidEmail 
} from "@/lib/formatUtils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { CompanyPicker } from "@/components/companies/CompanyPicker";
import { DealPicker } from "@/components/deals/DealPicker";
import { EntityTypeDropdown } from "@/components/entityTypes/EntityTypeDropdown";
import { LeadStatusDropdown, LeadTemperatureDropdown } from "@/components/leads";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ActivityFeed, CreateActivityModal } from "@/components/activities";
import { Tooltip } from "@/components/ui/tooltip";

interface Contact {
  contact: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    contact_type?: string;
    type?: string | null;
    address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    is_primary?: boolean;
    created_at?: string;
    // Lead management fields
    lead_status?: string | null;
    individual_lead_status?: string | null;
    lead_source?: string | null;
    lead_temperature?: string | null;
    lead_owner_id?: number | null;
    lead_assigned_date?: string | null;
  };
  company?: {
    id: number;
    name?: string;
    type?: string | null;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    website?: string;
    email?: string;
    // Lead management fields
    lead_status?: string | null;
    lead_source?: string | null;
    lead_temperature?: string | null;
    lead_owner_id?: number | null;
    lead_assigned_date?: string | null;
  };
  relatedDeals: Array<{
    deal: {
      id: number;
      title: string;
      amount?: number;
      stage?: string;
      close_date?: string;
      created_at?: string;
    };
    company?: {
      id: number;
      name?: string;
    };
  }>;
}


export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingDeals, setIsEditingDeals] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [editingContactData, setEditingContactData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    contact_type: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: '',
    is_primary: false
  });
  const [showPrimaryContactModal, setShowPrimaryContactModal] = useState(false);
  const [existingPrimaryContact, setExistingPrimaryContact] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState(true);
  
  // Activity Feed state
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note' | 'meeting' | 'task'>('note');
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const contactId = params.id as string;

  useEffect(() => {
    if (contactId) {
      fetchContactData();
    }
  }, [contactId]);

  // Validate form when editing starts or data changes
  useEffect(() => {
    if (isEditingContactInfo) {
      validateAllFields();
    }
  }, [isEditingContactInfo, editingContactData]);

  const fetchContactData = async () => {
    if (!contactId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
        setIsEditingDeals(false);
      } else {
        console.error('Failed to fetch contact');
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCompanyChange = (newCompany: any) => {
    setContact(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        company: newCompany
      };
    });
    // Auto-exit edit mode after successful company assignment/removal
    setIsEditingCompany(false);
  };

  const handleCancelCompanyEdit = () => {
    setIsEditingCompany(false);
  };

  const handleDealsUpdate = async () => {
    await fetchContactData();
  };

  const handleCancelDealsEdit = () => {
    setIsEditingDeals(false);
  };

  const handleEditContactInfo = () => {
    if (!contact) return;
    
    setEditingContactData({
      first_name: contact.contact.first_name || '',
      last_name: contact.contact.last_name || '',
      email: contact.contact.email || '',
      phone: contact.contact.phone || '',
      contact_type: contact.contact.contact_type || '',
      address: contact.contact.address || '',
      city: contact.contact.city || '',
      state_province: contact.contact.state_province || '',
      postal_code: contact.contact.postal_code || '',
      is_primary: contact.contact.is_primary || false
    });
    setIsEditingContactInfo(true);
  };

  const checkForExistingPrimaryContact = async (): Promise<any | null> => {
    if (!contact?.company?.id) return null;
    
    try {
      const response = await fetch(`/api/contacts?company_id=${contact.company.id}`);
      if (response.ok) {
        const contacts = await response.json();
        return contacts.find((c: any) => c.is_primary && c.id !== parseInt(contactId));
      }
    } catch (error) {
      console.error('Error checking for existing primary contact:', error);
    }
    return null;
  };

  const handleSaveContactInfo = async () => {
    if (!contact) return;
    
    // Validate all fields before saving
    if (!validateAllFields()) {
      return; // Don't save if validation fails
    }
    
    // If setting this contact as primary, check for conflicts
    if (editingContactData.is_primary && !contact.contact.is_primary) {
      const existingPrimary = await checkForExistingPrimaryContact();
      if (existingPrimary) {
        setExistingPrimaryContact(existingPrimary);
        setShowPrimaryContactModal(true);
        return; // Don't save yet, wait for user confirmation
      }
    }
    
    // No conflict or user confirmed, proceed with save
    await saveContactInfo();
  };

  const saveContactInfo = async () => {
    if (!contact) return;
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingContactData),
      });

      if (response.ok) {
        await fetchContactData();
        setIsEditingContactInfo(false);
        setShowPrimaryContactModal(false);
        setExistingPrimaryContact(null);
      } else {
        console.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleConfirmPrimaryContactChange = async () => {
    await saveContactInfo();
  };

  const handleCancelPrimaryContactChange = () => {
    setShowPrimaryContactModal(false);
    setExistingPrimaryContact(null);
    // Reset the is_primary checkbox to its original state
    setEditingContactData({
      ...editingContactData,
      is_primary: contact?.contact.is_primary || false
    });
  };

  const handleCancelContactInfoEdit = () => {
    setIsEditingContactInfo(false);
  };

  const formatCurrency = (amount?: number) => 
    amount ? `$${amount.toLocaleString()}` : '$0';

  const getStageColor = (stage?: string) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      'Qualification': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
      'Proposal': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
      'Negotiation': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700',
      'Closed Won': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      'Closed Lost': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
  };

  // Validation functions
  const validateField = (field: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (field) {
      case 'first_name':
        if (!value.trim()) errors.first_name = 'First name is required';
        break;
      case 'last_name':
        if (!value.trim()) errors.last_name = 'Last name is required';
        break;
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!isValidEmail(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !isValidPhone(value)) {
          errors.phone = 'Phone number must be 10 digits in format (###) ###-####';
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
    }
    
    return errors;
  };

  const validateAllFields = () => {
    const allErrors: {[key: string]: string} = {};
    
    // Validate all fields
    Object.entries(editingContactData).forEach(([field, value]) => {
      const fieldErrors = validateField(field, typeof value === 'string' ? value : '');
      Object.assign(allErrors, fieldErrors);
    });
    
    setValidationErrors(allErrors);
    const isValid = Object.keys(allErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleContactDataChange = (field: string, value: string) => {
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
    }
    
    // Update the data
    setEditingContactData({...editingContactData, [field]: formattedValue});
    
    // Validate the field
    const fieldErrors = validateField(field, formattedValue);
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

  // Activity handlers
  const handleOpenActivityModal = (type: 'call' | 'email' | 'note' | 'meeting' | 'task') => {
    setActivityType(type);
    setActivityError(null); // Clear any previous errors
    setShowCreateActivityModal(true);
  };

  const handleActivitySubmit = async (activityData: any) => {
    if (!session?.user?.id) return;
    
    setActivityLoading(true);
    setActivityError(null);
    
    try {
      const response = await fetch(`/api/contacts/${contactId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activityData,
          primary_entity_type: 'contact',
          primary_entity_id: parseInt(contactId),
          user_id: parseInt(session.user.id),
        }),
      });

      if (response.ok) {
        setShowCreateActivityModal(false);
        setActivityError(null);
        // Activity feed will refresh automatically via its own data fetching
        // Optionally refresh contact data to ensure any status changes are reflected
        // This maintains dropdown functionality after activity creation
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create activity' }));
        setActivityError(errorData.message || `Failed to create activity (${response.status})`);
        console.error('Failed to create activity:', errorData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error creating activity';
      setActivityError(errorMessage);
      console.error('Error creating activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };


  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error || !contact) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              {error || "Contact not found"}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The contact you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/dashboard/contacts">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
            </Link>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const fullName = `${contact.contact.first_name || ''} ${contact.contact.last_name || ''}`.trim();
  const fullAddress = [
    contact.contact.address,
    contact.contact.city,
    contact.contact.state_province,
    contact.contact.postal_code
  ].filter(Boolean).join(', ');

  const companyFullAddress = [
    contact.company?.address,
    contact.company?.city,
    contact.company?.state,
    contact.company?.country
  ].filter(Boolean).join(', ');

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Contacts", href: "/dashboard/contacts" },
    { label: fullName || "Contact", current: true }
  ];

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
                  {fullName || 'Unnamed Contact'}
                </h1>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <EntityTypeDropdown
                    entityType="contact"
                    entityId={contact.contact.id}
                    contact={{
                      type: contact.contact.type
                    }}
                    onTypeUpdate={fetchContactData}
                    size="sm"
                  />
                  {/* Lead Status - Only show for leads */}
                  {contact.contact.type === 'lead' && (
                    <LeadStatusDropdown
                      entityType="contact"
                      entityId={contact.contact.id}
                      contact={{
                        lead_status: contact.contact.lead_status,
                        lead_temperature: contact.contact.lead_temperature,
                        lead_source: contact.contact.lead_source,
                        lead_owner_id: contact.contact.lead_owner_id,
                        type: contact.contact.type
                      }}
                      onStatusUpdate={fetchContactData}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Contact Details and Relationship Management
              </p>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <div className="flex gap-2">
                  {isEditingContactInfo ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveContactInfo}
                        disabled={!isFormValid}
                        className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        <Save className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelContactInfoEdit}
                      >
                        <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditContactInfo}
                      className="opacity-100"
                    >
                      <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingContactInfo ? (
                  // Edit Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          First Name *
                        </label>
                        <Input
                          value={editingContactData.first_name}
                          onChange={(e) => handleContactDataChange('first_name', e.target.value)}
                          placeholder="First name"
                          className={`text-gray-900 dark:text-gray-100 ${validationErrors.first_name ? 'border-red-500 dark:border-red-500' : ''}`}
                        />
                        {validationErrors.first_name && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Last Name *
                        </label>
                        <Input
                          value={editingContactData.last_name}
                          onChange={(e) => handleContactDataChange('last_name', e.target.value)}
                          placeholder="Last name"
                          className={`text-gray-900 dark:text-gray-100 ${validationErrors.last_name ? 'border-red-500 dark:border-red-500' : ''}`}
                        />
                        {validationErrors.last_name && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={editingContactData.email}
                          onChange={(e) => handleContactDataChange('email', e.target.value)}
                          placeholder="Email address"
                          className={`text-gray-900 dark:text-gray-100 ${validationErrors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                        />
                        {validationErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone
                        </label>
                        <Input
                          value={editingContactData.phone}
                          onChange={(e) => handleContactDataChange('phone', e.target.value)}
                          placeholder="(###) ###-####"
                          className={`text-gray-900 dark:text-gray-100 ${validationErrors.phone ? 'border-red-500 dark:border-red-500' : ''}`}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Contact Type
                        </label>
                        <Input
                          value={editingContactData.contact_type}
                          onChange={(e) => setEditingContactData({...editingContactData, contact_type: e.target.value})}
                          placeholder="Contact type"
                          className="text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      {contact.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Primary Contact
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              checked={editingContactData.is_primary}
                              onChange={(e) => setEditingContactData({...editingContactData, is_primary: e.target.checked})}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Mark as primary contact for {contact.company.name}
                            </span>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Address
                        </label>
                        <Input
                          value={editingContactData.address}
                          onChange={(e) => setEditingContactData({...editingContactData, address: e.target.value})}
                          placeholder="Street address"
                          className="text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          City
                        </label>
                        <Input
                          value={editingContactData.city}
                          onChange={(e) => handleContactDataChange('city', e.target.value)}
                          placeholder="City"
                          className={`text-gray-900 dark:text-gray-100 ${validationErrors.city ? 'border-red-500 dark:border-red-500' : ''}`}
                        />
                        {validationErrors.city && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            State/Province
                          </label>
                          <Input
                            value={editingContactData.state_province}
                            onChange={(e) => setEditingContactData({...editingContactData, state_province: e.target.value})}
                            placeholder="State"
                            className="text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Postal Code
                          </label>
                          <Input
                            value={editingContactData.postal_code}
                            onChange={(e) => handleContactDataChange('postal_code', e.target.value)}
                            placeholder="12345 or A1A 1A1"
                            className={`text-gray-900 dark:text-gray-100 ${validationErrors.postal_code ? 'border-red-500 dark:border-red-500' : ''}`}
                          />
                          {validationErrors.postal_code && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.postal_code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Full Name
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {fullName || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {contact.contact.email ? (
                            <a 
                              href={`mailto:${contact.contact.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {contact.contact.email}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not specified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {contact.contact.phone ? (
                            <a 
                              href={`tel:${contact.contact.phone}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {contact.contact.phone}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Contact Type
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {contact.contact.contact_type || 'Not specified'}
                        </p>
                      </div>
                      {contact.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Primary Contact
                          </label>
                          <div className="flex items-center gap-2">
                            {contact.contact.is_primary ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                Primary Contact
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                Not primary contact
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Address
                        </label>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-gray-900 dark:text-gray-100">
                            {fullAddress || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Created
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900 dark:text-gray-100">
                            {contact.contact.created_at 
                              ? new Date(contact.contact.created_at).toLocaleDateString()
                              : 'Not specified'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Management and Company Information - Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Management Section - Left sub-column, only show for leads */}
              {(() => {
                // Check if this contact should show lead management fields
                const effectiveType = contact.contact.type || contact.company?.type;
                return effectiveType === 'lead';
              })() && (
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <User className="h-5 w-5" />
                    Lead Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lead Status and Temperature - Stacked for sub-column */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Lead Status
                      </label>
                      <LeadStatusDropdown
                        entityType="contact"
                        entityId={contact.contact.id}
                        contact={{
                          lead_status: contact.contact.lead_status,
                          lead_temperature: contact.contact.lead_temperature,
                          lead_source: contact.contact.lead_source,
                          lead_owner_id: contact.contact.lead_owner_id,
                          type: contact.contact.type
                        }}
                        onStatusUpdate={fetchContactData}
                        size="sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Lead Temperature
                      </label>
                      <LeadTemperatureDropdown
                        entityType="contact"
                        entityId={contact.contact.id}
                        contact={{
                          lead_status: contact.contact.lead_status,
                          lead_temperature: contact.contact.lead_temperature,
                          lead_source: contact.contact.lead_source,
                          lead_owner_id: contact.contact.lead_owner_id,
                          type: contact.contact.type
                        }}
                        onTemperatureUpdate={fetchContactData}
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
                        {contact.contact.lead_source 
                          ? contact.contact.lead_source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : 'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Lead Owner
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {contact.contact.lead_owner_id 
                          ? `Owner #${contact.contact.lead_owner_id}`
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
                          {contact.contact.lead_assigned_date 
                            ? new Date(contact.contact.lead_assigned_date).toLocaleDateString()
                            : 'Not assigned'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Company Information - Right sub-column, spans full width when no lead management */}
              <div className={(() => {
                const effectiveType = contact.contact.type || contact.company?.type;
                return effectiveType === 'lead' ? '' : 'lg:col-span-2';
              })()}>
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company
                      </div>
                      {!isEditingCompany && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingCompany(true)}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditingCompany ? (
                      /* Edit Mode - Show Company Management */
                      <div className="space-y-4">
                        <CompanyPicker
                          contactId={parseInt(contactId)}
                          currentCompany={contact.company || null}
                          onCompanyChange={handleCompanyChange}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelCompanyEdit}
                            className="text-gray-600 dark:text-gray-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Read-Only Mode - Show Company Info */
                      contact.company ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {contact.company.name?.substring(0, 2).toUpperCase() || 'CO'}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {contact.company.name || 'Unnamed Company'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                            </div>
                          </div>
                          
                          {(contact.company.website || contact.company.phone || companyFullAddress) && (
                            <>
                              <Separator className="bg-gray-200 dark:bg-gray-700" />
                              
                              <div className="space-y-3">
                                {contact.company.website && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                      Website
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Globe className="h-4 w-4 text-gray-400" />
                                      <a
                                        href={contact.company.website.startsWith('http') ? contact.company.website : `https://${contact.company.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                                      >
                                        {contact.company.website}
                                      </a>
                                    </div>
                                  </div>
                                )}
                                
                                {contact.company.phone && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                      Phone
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <a 
                                        href={`tel:${contact.company.phone}`}
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                      >
                                        {contact.company.phone}
                                      </a>
                                    </div>
                                  </div>
                                )}
                                
                                {companyFullAddress && (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                      Address
                                    </label>
                                    <div className="flex items-start gap-2 mt-1">
                                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <p className="text-gray-900 dark:text-gray-100 text-sm">
                                        {companyFullAddress}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                          
                          <Separator className="bg-gray-200 dark:bg-gray-700" />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => contact.company && window.open(`/dashboard/companies/${contact.company.id}`, '_blank')}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            View Company Details
                          </Button>
                        </div>
                      ) : (
                        /* No Company Assigned */
                        <div className="text-center py-6">
                          <Building2 className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                            No company associated with this contact
                          </p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>


            {/* Related Deals */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Related Deals ({contact.relatedDeals.length})
                  </div>
                  {!isEditingDeals && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingDeals(true)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingDeals ? (
                  /* Edit Mode - Show Deal Management */
                  <div className="space-y-4">
                    <DealPicker
                      contactId={parseInt(contactId)}
                      currentDeals={contact.relatedDeals.map(d => ({
                        id: d.deal.id,
                        title: d.deal.title,
                        amount: d.deal.amount,
                        stage: d.deal.stage,
                        close_date: d.deal.close_date,
                        created_at: d.deal.created_at,
                        company: d.company ? {
                          id: d.company.id,
                          name: d.company.name
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
                  contact.relatedDeals.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        No deals associated with this contact yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contact.relatedDeals.map((dealItem) => (
                        <div
                          key={dealItem.deal.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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
                                {dealItem.company && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {dealItem.company.name}
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

          {/* Right Sidebar - Activity Feed */}
          <div className="space-y-6">
            {/* Quick Actions Icon Bar */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 dark:text-gray-100 text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {activityError && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{activityError}</p>
                  </div>
                )}
                <div className="flex justify-center gap-3">
                  <Tooltip content="Log Call">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActivityModal('call')}
                      disabled={activityLoading}
                      className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Send Email">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActivityModal('email')}
                      disabled={activityLoading}
                      className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Add Note">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActivityModal('note')}
                      disabled={activityLoading}
                      className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900/20 dark:hover:text-gray-400 hover:border-gray-200 dark:hover:border-gray-800"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Schedule Meeting">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActivityModal('meeting')}
                      disabled={activityLoading}
                      className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Create Task">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenActivityModal('task')}
                      disabled={activityLoading}
                      className="flex-1 text-gray-700 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            {session?.user?.id && (
              <ActivityFeed
                entityType="contact"
                entityId={parseInt(contactId)}
                userId={parseInt(session.user.id)}
                showQuickActions={false}
                className=""
              />
            )}
          </div>
        </div>
      </div>

      {/* Primary Contact Conflict Resolution Modal */}
      <ConfirmationModal
        isOpen={showPrimaryContactModal}
        onClose={handleCancelPrimaryContactChange}
        onConfirm={handleConfirmPrimaryContactChange}
        title="Change Primary Contact?"
        description={
          existingPrimaryContact
            ? `${existingPrimaryContact.first_name} ${existingPrimaryContact.last_name} is currently the primary contact for ${contact?.company?.name}. Setting this contact as primary will remove the primary status from ${existingPrimaryContact.first_name} ${existingPrimaryContact.last_name}. Do you want to continue?`
            : "This will change the primary contact for this company. Do you want to continue?"
        }
        confirmText="Yes, Change Primary Contact"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Create Activity Modal */}
      {session?.user?.id && (
        <CreateActivityModal
          isOpen={showCreateActivityModal}
          onClose={() => setShowCreateActivityModal(false)}
          onSubmit={handleActivitySubmit}
          initialType={activityType}
          entityType="contact"
          entityId={parseInt(contactId)}
          userId={parseInt(session.user.id)}
        />
      )}
    </ClientDashboardLayout>
  );
} 