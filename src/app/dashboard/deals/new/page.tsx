"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Plus, DollarSign, Calendar, User, Building, Package
} from "lucide-react";
import Link from "next/link";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_id?: string;
}

interface Company {
  id: string;
  name?: string;
}

interface Offering {
  id: string;
  name?: string;
  type?: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage: 'Prospecting',
    close_date: '',
    contact_id: '',
    company_id: '',
    offering_id: '',
    deal_notes: ''
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch contacts
      const contactsRes = await fetch('/api/contacts');
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      // Fetch companies
      const companiesRes = await fetch('/api/companies');
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }

      // Fetch offerings
      const offeringsRes = await fetch('/api/offerings');
      if (offeringsRes.ok) {
        const offeringsData = await offeringsRes.json();
        setOfferings(offeringsData);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        id: `deal-${Date.now()}`,
        title: formData.title,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        stage: formData.stage,
        close_date: formData.close_date || null,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        offering_id: formData.offering_id || null,
        deal_notes: formData.deal_notes || null,
        created_at: new Date().toISOString(),
      };

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      if (res.ok) {
        router.push('/dashboard/deals');
      } else {
        throw new Error('Failed to create deal');
      }
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert('Failed to create deal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/deals');
  };

  return (
    <ClientDashboardLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/deals">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deals
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Create New Deal
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Add a new sales opportunity to your pipeline
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Deal Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter deal title"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Deal Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <select
                      id="stage"
                      name="stage"
                      value={formData.stage}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                    >
                      <option value="Prospecting">Prospecting</option>
                      <option value="Qualification">Qualification</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closed Won">Closed Won</option>
                      <option value="Closed Lost">Closed Lost</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="close_date">Expected Close Date</Label>
                    <Input
                      id="close_date"
                      name="close_date"
                      type="date"
                      value={formData.close_date}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deal_notes">Deal Notes</Label>
                  <Textarea
                    id="deal_notes"
                    name="deal_notes"
                    value={formData.deal_notes}
                    onChange={handleInputChange}
                    placeholder="Add any notes about this deal..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Company */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact & Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_id">Primary Contact</Label>
                    <select
                      id="contact_id"
                      name="contact_id"
                      value={formData.contact_id}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name} {contact.email && `(${contact.email})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="company_id">Company</Label>
                    <select
                      id="company_id"
                      name="company_id"
                      value={formData.company_id}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product/Service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product/Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="offering_id">Product/Service</Label>
                  <select
                    id="offering_id"
                    name="offering_id"
                    value={formData.offering_id}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a product/service</option>
                    {offerings.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.name} {offering.type && `(${offering.type})`}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ClientDashboardLayout>
  );
} 