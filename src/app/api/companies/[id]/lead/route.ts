import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, temperature, source, ownerId } = body;

    // Check if company exists and get its current type
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = existingCompany[0];

    // When updating lead status, don't clear fields based on entity type
    // Lead field clearing should only happen via the entity type endpoint
    const shouldClearLeadFields = false;

    // Prepare company update data
    const companyUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (shouldClearLeadFields) {
      // Clear all lead fields when entity type is no longer 'lead'
      companyUpdateData.lead_status = null;
      companyUpdateData.lead_temperature = null;
      companyUpdateData.lead_source = null;
      companyUpdateData.lead_assigned_date = null;
      companyUpdateData.lead_owner_id = null;
    } else {
      // Normal lead field updates
      if (status !== undefined) {
        companyUpdateData.lead_status = status;
        if (status) {
          companyUpdateData.lead_assigned_date = new Date().toISOString();
        }
      }
      if (temperature !== undefined) companyUpdateData.lead_temperature = temperature;
      if (source !== undefined) companyUpdateData.lead_source = source;
      if (ownerId !== undefined) companyUpdateData.lead_owner_id = ownerId;
    }

    // BIDIRECTIONAL SYNC: Update company and all related contacts
    const updates = [];

    // 1. Update the company
    updates.push(
      db.update(companies)
        .set(companyUpdateData)
        .where(eq(companies.id, companyId))
    );

    // 2. Update all related contacts with same lead data
    const contactsUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (shouldClearLeadFields) {
      // Clear lead fields for all contacts when company transitions away from lead
      contactsUpdateData.lead_status = null;
      contactsUpdateData.lead_temperature = null;
      contactsUpdateData.lead_source = null;
      contactsUpdateData.lead_assigned_date = null;
      contactsUpdateData.lead_owner_id = null;
      contactsUpdateData.individual_lead_status = null;
      contactsUpdateData.is_lead_contact = false;
    } else {
      // Sync lead fields to all contacts
      if (status !== undefined) {
        contactsUpdateData.lead_status = status;
        contactsUpdateData.individual_lead_status = status; // Keep for compatibility
        if (status) {
          contactsUpdateData.lead_assigned_date = new Date().toISOString();
        }
      }
      if (temperature !== undefined) contactsUpdateData.lead_temperature = temperature;
      if (source !== undefined) contactsUpdateData.lead_source = source;
      if (ownerId !== undefined) contactsUpdateData.lead_owner_id = ownerId;
    }

    updates.push(
      db.update(contacts)
        .set(contactsUpdateData)
        .where(eq(contacts.company_id, companyId))
    );

    // Execute all updates in parallel
    await Promise.all(updates);

    // Return the updated company with related contacts
    const updatedCompany = await db
      .select({
        company: companies,
        contacts: contacts
      })
      .from(companies)
      .leftJoin(contacts, eq(companies.id, contacts.company_id))
      .where(eq(companies.id, companyId));

    // Group the results properly
    const updatedCompanyData = updatedCompany[0]?.company;
    const relatedContacts = updatedCompany
      .filter(row => row.contacts !== null)
      .map(row => row.contacts);

    return NextResponse.json({
      company: updatedCompanyData,
      contacts: relatedContacts
    });
  } catch (error) {
    console.error('Error updating company lead status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}