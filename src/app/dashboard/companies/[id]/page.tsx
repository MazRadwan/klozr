"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ClientDashboardLayout } from '@/components/layout/ClientDashboardLayout';
import { 
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Users, 
  DollarSign, Calendar, MessageSquare, PhoneCall, Video, 
  FileText, Edit, Trash2, UserPlus, Plus, MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface Company {
  id: string;
  name?: string;
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
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_type?: string;
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
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

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

      const mockContacts: Contact[] = [
        {
          id: 'contact-1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@acme.com',
          phone: '+1 (555) 123-4567',
          contact_type: 'CEO',
          avatar: 'SJ'
        },
        {
          id: 'contact-2',
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'michael.chen@acme.com',
          phone: '+1 (555) 123-4568',
          contact_type: 'CTO',
          avatar: 'MC'
        }
      ];

      setCompany(companyData);
      setNotes(mockNotes);
      setActivities(mockActivities);
      setContacts(mockContacts);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: `note-${Date.now()}`,
      content: newNote,
      created_at: new Date().toISOString(),
      created_by: 'Current User'
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote('');
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

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Companies", href: "/dashboard/companies" },
    { label: company?.name || "Company", href: "#" }
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {company.industry && (
                  <Badge className={getIndustryColor(company.industry)}>
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
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
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
              <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts.map((contact) => (
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
                ))}
              </div>
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
                  className="min-h-[80px] resize-none bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
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
              <Button variant="outline" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Create Deal
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
      </div>
    </ClientDashboardLayout>
  );
} 