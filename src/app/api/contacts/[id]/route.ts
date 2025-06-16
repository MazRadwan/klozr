import { NextRequest, NextResponse } from 'next/server';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeContactService } from '@/server/services';

export const GET = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const contactId = parseInt(id);
  
  if (isNaN(contactId)) {
    throwError.badRequest('Invalid contact ID');
  }
  
  const contactService = makeContactService();
  const result = await contactService.getContactWithRelatedData(contactId);
  
  if (!result) {
    throwError.notFound('Contact not found');
  }
  
  return NextResponse.json(result);
});

export const PUT = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const contactId = parseInt(id);
  
  if (isNaN(contactId)) {
    throwError.badRequest('Invalid contact ID');
  }
  
  const body = await req.json();
  const contactService = makeContactService();
  
  const result = await contactService.updateContact(contactId, body);
  
  if (!result.success) {
    if (result.error === 'Contact not found') {
      throwError.notFound('Contact not found');
    }
    throwError.internal(`Failed to update contact: ${result.error}`);
  }
  
  // Return the raw updated result to match original behavior
  return NextResponse.json(result.contact);
});

export const PATCH = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const contactId = parseInt(id);
  
  if (isNaN(contactId)) {
    throwError.badRequest('Invalid contact ID');
  }
  
  const body = await req.json();
  const { company_id } = body;
  
  const contactService = makeContactService();
  const result = await contactService.updateContactCompanyAssociation(contactId, company_id);
  
  if (!result.success) {
    if (result.error === 'Contact not found') {
      throwError.notFound('Contact not found');
    }
    throwError.internal(`Failed to update contact company association: ${result.error}`);
  }
  
  // Return exact same format as original
  return NextResponse.json({ success: true, updated: result.updated });
});

export const DELETE = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const contactId = parseInt(id);
  
  if (isNaN(contactId)) {
    throwError.badRequest('Invalid contact ID');
  }
  
  const contactService = makeContactService();
  const deleteResult = await contactService.deleteContact(contactId);
  
  if (!deleteResult.success) {
    if (deleteResult.error === 'Contact not found') {
      throwError.notFound('Contact not found');
    }
    throwError.internal(`Failed to delete contact: ${deleteResult.error}`);
  }
  
  // Return the raw database result to match original behavior exactly
  return NextResponse.json(deleteResult.result);
});

/* ORIGINAL LOGIC PRESERVED FOR ROLLBACK IF NEEDED:

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, deals, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { id } = await params;
    const contactId = parseInt(id);
    
    // Validate that the ID is a valid integer
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }

    // Get the main contact
    const contactResult = await db
      .select({
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          contact_type: contacts.contact_type,
          type: contacts.type,
          company_id: contacts.company_id,
          owner_user_id: contacts.owner_user_id,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
          // Lead management fields
          lead_status: contacts.lead_status,
          individual_lead_status: contacts.individual_lead_status,
          lead_temperature: contacts.lead_temperature,
          lead_source: contacts.lead_source,
          lead_owner_id: contacts.lead_owner_id,
          lead_assigned_date: contacts.lead_assigned_date,
          created_at: contacts.created_at,
          updated_at: contacts.updated_at,
        },
        company: {
          id: companies.id,
          name: companies.name,
          type: companies.type,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
          industry: companies.industry,
          lead_status: companies.lead_status,
          lead_source: companies.lead_source,
          lead_temperature: companies.lead_temperature,
          lead_owner_id: companies.lead_owner_id,
        }
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (contactResult.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get related deals
    const relatedDeals = await db
      .select({
        deal: {
          id: deals.id,
          title: deals.title,
          amount: deals.amount,
          stage: deals.stage,
          close_date: deals.close_date,
          created_at: deals.created_at,
          updated_at: deals.updated_at,
          deal_notes: deals.deal_notes,
        },
        company: {
          id: companies.id,
          name: companies.name,
        },
      })
      .from(deals)
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .where(eq(deals.contact_id, contactId));

    const response = {
      contact: contactResult[0].contact,
      company: contactResult[0].company,
      relatedDeals
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

... (rest of original PATCH logic preserved for rollback)

*/