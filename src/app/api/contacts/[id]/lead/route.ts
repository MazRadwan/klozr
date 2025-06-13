import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';
import { LeadSyncService } from '@/server/services/LeadSyncService';

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

    // Use LeadSyncService for bi-directional lead data update
    const leadSyncService = new LeadSyncService();
    const result = await leadSyncService.updateContactLeadData(contactId, {
      status,
      temperature,
      source,
      ownerId
    });

    if (!result.success) {
      console.error(`[Contact Lead Update] Service failed for contact ${contactId}:`, result.error);
      return NextResponse.json({ 
        error: 'Failed to update lead data', 
        details: result.error 
      }, { status: 500 });
    }

    console.log(`[Contact Lead Update] Successfully updated contact ${contactId}, company ${contact.company_id}, and related contacts via service`);

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