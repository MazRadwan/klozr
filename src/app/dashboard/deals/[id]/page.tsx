"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, Building, 
  Package, Mail, Phone, MapPin, FileText, Upload, Download, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DealCompanyPicker } from "@/components/deals/DealCompanyPicker";

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
}

interface Company {
  id: number;
  name?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
}

interface Offering {
  id: number;
  name?: string;
  type?: string;
  description?: string;
  price?: number;
}

interface Deal {
  deal: {
    id: number;
    title: string;
    amount?: number;
    stage?: string;
    close_date?: string;
    deal_notes?: string;
    created_at?: string;
    updated_at?: string;
  };
  contact?: Contact;
  company?: Company;
  offering?: Offering;
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDeal(params.id as string);
    }
  }, [params.id]);

  const fetchDeal = async (id: string) => {
    try {
      const res = await fetch(`/api/deals/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Deal not found");
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return;
      }
      const data = await res.json();
      setDeal(data);
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      setError("Failed to load deal");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async () => {
    if (params.id) {
      await fetchDeal(params.id as string);
      setIsEditingCompany(false);
    }
  };

  const formatCurrency = (amount?: number) => 
    amount ? `$${amount.toLocaleString()}` : '$0';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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

  if (error || !deal) {
    return (
      <ClientDashboardLayout>
        <div className="p-4 sm:p-8">
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              {error || "Deal not found"}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The deal you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/deals">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

    // Breadcrumb items
  const breadcrumbItems = [
    { label: "Deals", href: "/dashboard/deals" },
    { label: deal.deal.title || "Deal", current: true }
  ];

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8">
        <div className="space-y-6">
          {/* Back Button + Breadcrumbs in single row */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/deals">
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deals
              </Button>
            </Link>
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Header - with increased top spacing and proper alignment */}
          <div className="pt-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="max-w-none">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {deal.deal.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Deal Details
                </p>
              </div>
              <div className="flex gap-2 sm:flex-shrink-0">
                <Link href={`/dashboard/deals/${deal.deal.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Deal
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Deal Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Overview */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Deal Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(deal.deal.amount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage</label>
                      <div className="mt-1">
                        <Badge variant="secondary" className={getStageColor(deal.deal.stage)}>
                          {deal.deal.stage || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Close Date</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatDate(deal.deal.close_date)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatDate(deal.deal.created_at)}
                      </p>
                    </div>
                  </div>

                  {deal.deal.deal_notes && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                        <p className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {deal.deal.deal_notes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Product/Service Information */}
              {deal.offering && (
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product/Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {deal.offering.name}
                      </p>
                    </div>
                    {deal.offering.type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {deal.offering.type}
                        </p>
                      </div>
                    )}
                    {deal.offering.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {deal.offering.description}
                        </p>
                      </div>
                    )}
                    {deal.offering.price && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">List Price</label>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {formatCurrency(deal.offering.price)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Documents Section */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No documents yet</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Upload documents related to this deal.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact & Company */}
            <div className="space-y-6">
              {/* Contact Information */}
              {deal.contact && (
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {deal.contact.first_name ? deal.contact.first_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {deal.contact.first_name} {deal.contact.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Primary Contact</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {deal.contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <a 
                              href={`mailto:${deal.contact.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {deal.contact.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {deal.contact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <a 
                              href={`tel:${deal.contact.phone}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {deal.contact.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {(deal.contact.address || deal.contact.city) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                            <p className="text-gray-900 dark:text-gray-100">
                              {deal.contact.address && <span>{deal.contact.address}<br /></span>}
                              {deal.contact.city && <span>{deal.contact.city}</span>}
                              {deal.contact.state_province && <span>, {deal.contact.state_province}</span>}
                              {deal.contact.postal_code && <span> {deal.contact.postal_code}</span>}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />
                    <div className="flex gap-2">
                      <Link href={`/dashboard/contacts/${deal.contact.id}`}>
                        <Button variant="outline" size="sm" className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Contact
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Company Information */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Company
                    </CardTitle>
                    {!isEditingCompany && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingCompany(true)}
                        className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingCompany ? (
                    <div className="space-y-4">
                      <DealCompanyPicker
                        dealId={deal.deal.id}
                        currentCompany={deal.company ? {
                          id: deal.company.id,
                          name: deal.company.name || '',
                          email: undefined,
                          phone: deal.company.phone,
                          website: deal.company.website
                        } : null}
                        currentContact={deal.contact ? {
                          id: deal.contact.id,
                          first_name: deal.contact.first_name,
                          last_name: deal.contact.last_name,
                          email: deal.contact.email,
                          phone: deal.contact.phone,
                          is_primary: false
                        } : null}
                        onCompanyUpdate={handleCompanyUpdate}
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditingCompany(false)}
                          className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : deal.company ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {deal.company.name ? deal.company.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {deal.company.name}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {deal.company.website && (
                          <div className="flex items-center gap-3">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                              <a 
                                href={deal.company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {deal.company.website}
                              </a>
                            </div>
                          </div>
                        )}

                        {deal.company.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                              <a 
                                href={`tel:${deal.company.phone}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {deal.company.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {(deal.company.address || deal.company.city) && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                              <p className="text-gray-900 dark:text-gray-100">
                                {deal.company.address && <span>{deal.company.address}<br /></span>}
                                {deal.company.city && <span>{deal.company.city}</span>}
                                {deal.company.state && <span>, {deal.company.state}</span>}
                                {deal.company.country && <span><br />{deal.company.country}</span>}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                      <div className="flex gap-2">
                        <Link href={`/dashboard/companies/${deal.company.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Company
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No company assigned</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Link this deal to a company.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline Placeholder */}
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-none hover:shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">No activity yet</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Activity and communications will appear here.
                    </p>
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