"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, 
  DollarSign, ExternalLink, User, Globe
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

interface Contact {
  contact: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    contact_type?: string;
    address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    created_at?: string;
  };
  company?: {
    id: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
  };
  relatedDeals: Array<{
    deal: {
      id: string;
      title: string;
      amount?: number;
      stage?: string;
      close_date?: string;
      created_at?: string;
    };
    company?: {
      id: string;
      name?: string;
    };
  }>;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contactId = params.id as string;

  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Contact not found");
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return;
      }
      const data = await res.json();
      setContact(data);
    } catch (error) {
      console.error("Failed to fetch contact:", error);
      setError("Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => 
    amount ? `$${amount.toLocaleString()}` : '$0';

  const getStageColor = (stage?: string) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Qualification': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Proposal': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Closed Won': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Closed Lost': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {fullName || 'Unnamed Contact'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Contact Details and Related Deals
            </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Full Name
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {fullName || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-gray-100">
                          {contact.contact.email || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone
                      </label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-gray-100">
                          {contact.contact.phone || 'Not specified'}
                        </p>
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

            {/* Related Deals */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <DollarSign className="h-5 w-5" />
                  Related Deals ({contact.relatedDeals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact.relatedDeals.length === 0 ? (
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
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-none transition-colors"
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
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Amount: <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(dealItem.deal.amount)}
                                </span>
                              </span>
                              <Badge variant="secondary" className={getStageColor(dealItem.deal.stage)}>
                                {dealItem.deal.stage || 'Unknown'}
                              </Badge>
                              {dealItem.deal.close_date && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  Close: {new Date(dealItem.deal.close_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Information */}
            {contact.company && (
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Building2 className="h-5 w-5" />
                    Company
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {contact.company.name}
                    </h3>
                  </div>
                  
                  <Separator className="bg-gray-200 dark:bg-gray-700" />
                  
                  <div className="space-y-3">
                    {contact.company.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Website
                        </label>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={contact.company.website.startsWith('http') ? contact.company.website : `https://${contact.company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            {contact.company.website}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {contact.company.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900 dark:text-gray-100">
                            {contact.company.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {companyFullAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Address
                        </label>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-gray-900 dark:text-gray-100">
                            {companyFullAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-gray-200 dark:bg-gray-700" />
                  
                  <Link href={`/dashboard/companies/${contact.company.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      View Company Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/dashboard/deals/new?contact_id=${contact.contact.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Deal
                  </Button>
                </Link>
                <Link href={`/dashboard/contacts/${contact.contact.id}/edit`}>
                  <Button
                    variant="outline"
                    className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Edit Contact
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
} 