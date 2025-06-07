import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, temperature, source, ownerId } = body;

    // Get the current contact with company info
    const currentContact = await db
      .select({
        contact: contacts,
        company: companies
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (currentContact.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contact = currentContact[0].contact;
    const company = currentContact[0].company;

    // Prepare contact update data
    const contactUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      contactUpdateData.individual_lead_status = status;
      if (status) {
        contactUpdateData.lead_assigned_date = new Date().toISOString();
      }
    }
    if (source !== undefined) contactUpdateData.lead_source = source;
    if (ownerId !== undefined) contactUpdateData.lead_owner_id = ownerId;

    // Auto-sync logic: If contact has a company and we're setting a lead status,
    // also update the company's lead status (if company doesn't already have one)
    if (status && contact.company_id && company) {
      // If company doesn't have a lead status, inherit from contact
      if (!company.lead_status) {
        const companyUpdateData: any = {
          lead_status: status,
          lead_assigned_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        if (temperature !== undefined) companyUpdateData.lead_temperature = temperature;
        if (source !== undefined) companyUpdateData.lead_source = source;
        if (ownerId !== undefined) companyUpdateData.lead_owner_id = ownerId;

        // Update company
        await db
          .update(companies)
          .set(companyUpdateData)
          .where(eq(companies.id, contact.company_id));

        // Mark this contact as the lead contact for the company
        contactUpdateData.is_lead_contact = true;
      }
    }

    // Update the contact
    await db
      .update(contacts)
      .set(contactUpdateData)
      .where(eq(contacts.id, contactId));

    // Return the updated contact with company info
    const updatedContact = await db
      .select({
        contact: contacts,
        company: companies
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    return NextResponse.json(updatedContact[0]);
  } catch (error) {
    console.error('Error updating contact lead status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 