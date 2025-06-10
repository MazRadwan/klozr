"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { 
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, 
  DollarSign, ExternalLink, User, Globe, Plus, MessageSquare,
  FileText, Clock, Send, Edit, Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { CompanyPicker } from "@/components/companies/CompanyPicker";
import { DealPicker } from "@/components/deals/DealPicker";
import { EntityTypeDropdown } from "@/components/entityTypes/EntityTypeDropdown";
import { LeadStatusDropdown } from "@/components/leads/LeadStatusDropdown";

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
    created_at?: string;
    // Lead management fields
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

interface Note {
  id: string;
  content: string;
  created_at: string;
  author: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  author: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingDeals, setIsEditingDeals] = useState(false);

  const contactId = params.id as string;

  useEffect(() => {
    if (contactId) {
      fetchContactData();
      fetchNotes();
      fetchActivities();
    }
  }, [contactId]);

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

  const fetchNotes = async () => {
    // Mock notes data - in real app, this would fetch from API
    setNotes([
      {
        id: "note-1",
        content: "Had a great conversation about their upcoming project requirements. They're looking to implement a new CRM system and are very interested in our enterprise solution.",
        created_at: "2025-01-15T14:30:00Z",
        author: "John Smith"
      },
      {
        id: "note-2", 
        content: "Follow-up scheduled for next week to discuss technical specifications and pricing. They mentioned budget approval process takes 2-3 weeks.",
        created_at: "2025-01-16T10:15:00Z",
        author: "Jane Doe"
      }
    ]);
  };

  const fetchActivities = async () => {
    // Mock activities data - in real app, this would fetch from API
    setActivities([
      {
        id: "activity-1",
        type: "email",
        description: "Sent product demo email with pricing information",
        created_at: "2025-01-15T09:00:00Z",
        author: "System"
      },
      {
        id: "activity-2",
        type: "call",
        description: "Phone call - 45 minutes discussion about requirements and implementation timeline",
        created_at: "2025-01-15T14:30:00Z", 
        author: "John Smith"
      },
      {
        id: "activity-3",
        type: "meeting",
        description: "Scheduled follow-up meeting for next Tuesday at 2 PM",
        created_at: "2025-01-16T16:00:00Z",
        author: "Jane Doe"
      },
      {
        id: "activity-4",
        type: "note",
        description: "Added note about budget approval process",
        created_at: "2025-01-16T16:30:00Z",
        author: "Jane Doe"
      }
    ]);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    
    try {
      // In real app, this would POST to API
      const note: Note = {
        id: Math.random().toString(36), // Temporary ID for UI
        content: newNote,
        created_at: new Date().toISOString(),
        author: "Current User"
      };
      
      setNotes(prev => [note, ...prev]);
      
      // Add activity for the note
      const activity: Activity = {
        id: Math.random().toString(36), // Temporary ID for UI
        type: "note",
        description: `Added note: ${newNote.substring(0, 50)}${newNote.length > 50 ? '...' : ''}`,
        created_at: new Date().toISOString(),
        author: "Current User"
      };
      setActivities(prev => [activity, ...prev]);
      
      setNewNote("");
    } finally {
      setAddingNote(false);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'call': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'meeting': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'note': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <div className="flex-shrink-0">
                  <EntityTypeDropdown
                    entityType="contact"
                    entityId={contact.contact.id}
                    contact={{
                      type: contact.contact.type,
                      company_id: contact.company?.id || null,
                      company: contact.company ? {
                        type: contact.company.type,
                        name: contact.company.name
                      } : null
                    }}
                    onTypeUpdate={fetchContactData}
                    size="sm"
                  />
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Lead Management Section - Only show for leads */}
            {(() => {
              // Check if this contact should show lead management fields
              const effectiveType = contact.contact.type || contact.company?.type;
              return effectiveType === 'lead';
            })() && (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MessageSquare className="h-5 w-5" />
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lead Status */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Lead Status
                  </label>
                  <LeadStatusDropdown
                    entityType="contact"
                    entityId={contact.contact.id}
                    contact={{
                      individual_lead_status: contact.contact.individual_lead_status,
                      company_id: contact.company?.id || null,
                      company: contact.company ? {
                        lead_status: contact.company.lead_status
                      } : null,
                      type: contact.contact.type
                    }}
                    onStatusUpdate={fetchContactData}
                    size="sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Lead Temperature
                      </label>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const temperature = contact.contact.lead_temperature;
                          if (!temperature) return <span className="text-gray-500">Not specified</span>;
                          
                          const tempColors = {
                            hot: 'bg-red-100 text-red-800 border-red-200',
                            warm: 'bg-orange-100 text-orange-800 border-orange-200', 
                            cold: 'bg-blue-100 text-blue-800 border-blue-200'
                          };
                          
                          return (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tempColors[temperature as keyof typeof tempColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {temperature.charAt(0).toUpperCase() + temperature.slice(1)}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
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
                </div>
              </CardContent>
            </Card>
            )}

            {/* Notes Section */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes ({notes.length})
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note about this contact..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px] bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <Button 
                    onClick={addNote} 
                    disabled={!newNote.trim() || addingNote}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>

                {notes.length > 0 && <Separator />}

                {/* Notes List */}
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      No notes yet. Add the first note above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{note.author}</span>
                          <span>•</span>
                          <span>{formatDateTime(note.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Information */}
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

            {/* Activity Timeline */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                      No activities yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activities.slice(0, 5).length - 1 && (
                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{activity.author}</span>
                            <span>•</span>
                            <span>{formatDateTime(activity.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activities.length > 5 && (
                      <div className="text-center pt-3">
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                          View All Activities ({activities.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setIsEditingDeals(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Manage Deals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
} 