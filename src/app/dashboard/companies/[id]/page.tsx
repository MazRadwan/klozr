"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ClientDashboardLayout } from '@/components/layout/ClientDashboardLayout';
import { ContactPicker } from '@/components/contacts/ContactPicker';
import { NewContactModal } from '@/components/contacts/NewContactModal';
import { CompanyDealPicker } from '@/components/deals/CompanyDealPicker';
import { EntityTypeDropdown } from '@/components/entityTypes/EntityTypeDropdown';
import { 
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Users, 
  DollarSign, Calendar, MessageSquare, PhoneCall, Video, 
  FileText, Edit, Trash2, UserPlus, Plus, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface Company {
  id: number;
  name?: string;
  type?: string | null;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  employees?: number;
  revenue?: string;
  founded?: string;
  description?: string;
  created_at?: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  title: string;
  description?: string;
  created_at: string;
  created_by: string;
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
  created_at?: string;
  avatar?: string;
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  
  // Modal states
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [newContactModalOpen, setNewContactModalOpen] = useState(false);
  
  // Edit states
  const [isEditingDeals, setIsEditingDeals] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Fetch company data from API
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      const companyData = await res.json();

      const mockNotes: Note[] = [
        {
          id: 'note-1',
          content: 'Initial company research completed. Strong technology portfolio and growing market presence.',
          created_at: '2024-01-15T10:30:00Z',
          created_by: 'John Doe'
        },
        {
          id: 'note-2', 
          content: 'Discussed potential partnership opportunities. Follow up meeting scheduled for next week.',
          created_at: '2024-01-10T14:20:00Z',
          created_by: 'Jane Smith'
        }
      ];

      const mockActivities: Activity[] = [
        {
          id: 'activity-1',
          type: 'meeting',
          title: 'Partnership Discussion',
          description: 'Met with leadership team to discuss strategic partnership',
          created_at: '2024-01-16T09:00:00Z',
          created_by: 'John Doe'
        },
        {
          id: 'activity-2',
          type: 'email',
          title: 'Follow-up Email Sent',
          description: 'Sent follow-up with partnership proposal details',
          created_at: '2024-01-15T16:30:00Z',
          created_by: 'Jane Smith'
        },
        {
          id: 'activity-3',
          type: 'call',
          title: 'Initial Contact Call',
          description: 'First outreach call to introduce our services',
          created_at: '2024-01-12T11:15:00Z',
          created_by: 'Mike Johnson'
        }
      ];

      // Fetch real contacts for this company
      const contactsRes = await fetch(`/api/contacts?company_id=${companyId}`);
      let realContacts: Contact[] = [];
      if (contactsRes.ok) {
        realContacts = await contactsRes.json();
      }

      // Fetch real deals for this company
      const dealsRes = await fetch(`/api/deals?company_id=${companyId}`);
      let realDeals: any[] = [];
      if (dealsRes.ok) {
        realDeals = await dealsRes.json();
      }

      setCompany(companyData);
      setNotes(mockNotes);
      setActivities(mockActivities);
      setContacts(realContacts);
      setDeals(realDeals);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Math.random().toString(36), // Temporary ID for UI
      content: newNote,
      created_at: new Date().toISOString(),
      created_by: 'Current User'
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote('');
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
    fetchCompanyData();
  };

  const handleCancelDealsEdit = () => {
    setIsEditingDeals(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <PhoneCall className="h-4 w-4 text-green-500" />;
      case 'meeting':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'note':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
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
                <div className="flex-shrink-0">
                  <EntityTypeDropdown
                    entityType="company"
                    entityId={company.id}
                    company={{
                      type: company.type
                    }}
                    onTypeUpdate={fetchCompanyData}
                    size="sm"
                  />
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
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {(company.address || company.city || company.state) && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {[company.address, company.city, company.state].filter(Boolean).join(', ')}
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
            </CardContent>
          </Card>

          {/* Key Contacts */}
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
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                        </p>
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

          {/* Related Deals */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Related Deals ({deals.length})
                </div>
              </CardTitle>
              {!isEditingDeals && (
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

          {/* Notes Section */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note about this company..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] resize-none bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Existing notes */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>By {note.created_by}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" size="sm">
                <PhoneCall className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
              <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" size="sm">
                <Video className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" 
                size="sm"
                onClick={() => setIsEditingDeals(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Manage Deals
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(activity.created_at)} • {activity.created_by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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