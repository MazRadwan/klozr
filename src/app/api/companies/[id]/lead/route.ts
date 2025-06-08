import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, temperature, source, ownerId } = body;

    // Check if company exists
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Prepare company update data
    const companyUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      companyUpdateData.lead_status = status;
      if (status) {
        companyUpdateData.lead_assigned_date = new Date().toISOString();
      }
    }
    if (temperature !== undefined) companyUpdateData.lead_temperature = temperature;
    if (source !== undefined) companyUpdateData.lead_source = source;
    if (ownerId !== undefined) companyUpdateData.lead_owner_id = ownerId;

    // Update the company
    await db
      .update(companies)
      .set(companyUpdateData)
      .where(eq(companies.id, companyId));

    // Auto-sync logic: Update all related contacts to inherit the new status
    // Clear individual lead statuses for contacts that belong to this company
    // (company lead status takes precedence)
    if (status !== undefined) {
      await db
        .update(contacts)
        .set({
          // Don't clear individual_lead_status entirely, but the UI will show company status as inherited
          updated_at: new Date().toISOString()
        })
        .where(eq(contacts.company_id, companyId));
    }

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
    const company = updatedCompany[0]?.company;
    const relatedContacts = updatedCompany
      .filter(row => row.contacts !== null)
      .map(row => row.contacts);

    return NextResponse.json({
      company,
      contacts: relatedContacts
    });
  } catch (error) {
    console.error('Error updating company lead status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 