"use client";

import React, { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Deal {
  id: number;
  title: string;
  amount?: number;
  stage?: string;
  close_date?: string;
  created_at?: string;
  company?: {
    id: number;
    name?: string;
  };
}

interface Company {
  id: number;
  name?: string;
}

interface Offering {
  id: number;
  name?: string;
  type?: string;
  price?: number;
}

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: number;
  companyId?: number;
  companyName?: string;
  onDealCreated: (deal: Deal) => void;
}

export function NewDealModal({ isOpen, onClose, contactId, companyId, companyName, onDealCreated }: NewDealModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    stage: "Prospecting",
    close_date: "",
    company_id: "",
    offering_id: "",
    deal_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      // Pre-populate company if provided
      if (companyId) {
        setFormData(prev => ({ ...prev, company_id: companyId.toString() }));
      }
    }
  }, [isOpen, companyId]);

  const fetchDropdownData = async () => {
    try {
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
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Deal title is required";
    }
    
    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Amount must be a valid number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        contact_id: contactId || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        company_id: formData.company_id ? parseInt(formData.company_id) : undefined,
        offering_id: formData.offering_id ? parseInt(formData.offering_id) : undefined,
      };

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const newDeal = await response.json();
        onDealCreated(newDeal);
        handleClose();
      } else {
        console.error('Failed to create deal');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      amount: "",
      stage: "Prospecting",
      close_date: "",
      company_id: "",
      offering_id: "",
      deal_notes: "",
    });
    setErrors({});
    onClose();
  };

  const stages = [
    "Prospecting",
    "Qualification", 
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create New Deal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Deal Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter deal title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Deal Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close_date">Expected Close Date</Label>
            <Input
              id="close_date"
              name="close_date"
              type="date"
              value={formData.close_date}
              onChange={handleInputChange}
            />
          </div>

          <div className={`grid ${companyId ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            {!companyId && (
              <div className="space-y-2">
                <Label htmlFor="company_id">Company</Label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {companyId && companyName && (
              <div className="space-y-2">
                <Label>Company</Label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100">
                  {companyName}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="offering_id">Product/Service</Label>
              <select
                id="offering_id"
                name="offering_id"
                value={formData.offering_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select offering</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.name} {offering.type && `(${offering.type})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_notes">Notes</Label>
            <Textarea
              id="deal_notes"
              name="deal_notes"
              value={formData.deal_notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this deal..."
              rows={3}
              className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 