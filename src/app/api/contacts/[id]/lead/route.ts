import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

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
    
    console.log(`[Contact Lead Update] Request for contact ${contactId}:`, { status, temperature, source, ownerId });

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
    
    console.log(`[Contact Lead Update] Found contact:`, {
      id: contact.id,
      name: `${contact.first_name} ${contact.last_name}`,
      current_lead_status: contact.lead_status,
      type: contact.type,
      company_id: contact.company_id,
      company_name: company?.name
    });

    // When updating lead status, don't clear fields based on entity type
    // Lead field clearing should only happen via the entity type endpoint
    const shouldClearLeadFields = false;

    // Prepare contact update data
    const contactUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (shouldClearLeadFields) {
      // Clear all lead fields when entity type is no longer 'lead'
      contactUpdateData.lead_status = null;
      contactUpdateData.lead_temperature = null;
      contactUpdateData.lead_source = null;
      contactUpdateData.lead_assigned_date = null;
      contactUpdateData.lead_owner_id = null;
      contactUpdateData.individual_lead_status = null;
      contactUpdateData.is_lead_contact = false;
    } else {
      // Normal lead field updates
      if (status !== undefined) {
        contactUpdateData.lead_status = status;
        contactUpdateData.individual_lead_status = status; // Keep for compatibility
        if (status) {
          contactUpdateData.lead_assigned_date = new Date().toISOString();
        }
      }
      if (temperature !== undefined) contactUpdateData.lead_temperature = temperature;
      if (source !== undefined) contactUpdateData.lead_source = source;
      if (ownerId !== undefined) contactUpdateData.lead_owner_id = ownerId;
    }
    
    console.log(`[Contact Lead Update] Contact update data:`, contactUpdateData);

    // BIDIRECTIONAL SYNC: Update related entities
    const updates = [];

    // 1. Update the contact itself
    updates.push(
      db.update(contacts)
        .set(contactUpdateData)
        .where(eq(contacts.id, contactId))
    );

    // 2. Update company if exists
    if (contact.company_id) {
      const companyUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      if (shouldClearLeadFields) {
        // Clear company lead fields too when transitioning away from lead
        companyUpdateData.lead_status = null;
        companyUpdateData.lead_temperature = null;
        companyUpdateData.lead_source = null;
        companyUpdateData.lead_assigned_date = null;
        companyUpdateData.lead_owner_id = null;
      } else {
        // Sync lead fields to company
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

      updates.push(
        db.update(companies)
          .set(companyUpdateData)
          .where(eq(companies.id, contact.company_id))
      );

      // 3. Update all other contacts in the same company
      const otherContactsUpdateData = { ...contactUpdateData };
      delete otherContactsUpdateData.individual_lead_status; // Don't override individual status
      delete otherContactsUpdateData.is_lead_contact; // Don't change lead contact designation

      updates.push(
        db.update(contacts)
          .set(otherContactsUpdateData)
          .where(
            and(
              eq(contacts.company_id, contact.company_id),
              ne(contacts.id, contactId)
            )
          )
      );
    }

    // Execute all updates with proper error handling
    try {
      await Promise.all(updates);
      console.log(`[Contact Lead Update] Successfully updated contact ${contactId}, company ${contact.company_id}, and ${contact.company_id ? 'related contacts' : 'no related contacts'}`);
    } catch (error) {
      console.error(`[Contact Lead Update] Failed to update entities for contact ${contactId}:`, error);
      return NextResponse.json({ 
        error: 'Failed to update lead status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }

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