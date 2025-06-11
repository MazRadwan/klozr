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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const contactId = parseInt(id);
  
  // Validate that the ID is a valid integer
  if (isNaN(contactId)) {
    return NextResponse.json(
      { error: 'Invalid contact ID' },
      { status: 400 }
    );
  }
  
  const body = await req.json();
  const updated = db.update(contacts).set(body).where(eq(contacts.id, contactId)).run();
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    const body = await req.json();
    const { company_id } = body;
    
    console.log(`[PATCH] Contact ${contactId} company association: ${company_id}`);
    
    // Get current contact data to determine what sync operations are needed
    const currentContact = db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .get();
    
    if (!currentContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    const oldCompanyId = currentContact.company_id;
    const newCompanyId = company_id === null ? null : parseInt(company_id);
    
    // Update the contact's company association
    const updated = db
      .update(contacts)
      .set({ 
        company_id: newCompanyId,
        updated_at: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId))
      .run();
    
    console.log(`[PATCH] Contact updated: ${JSON.stringify(updated)}`);
    
    // Perform bi-directional sync operations
    const syncOperations = [];
    
    // Case 1: Linking contact to a company (newCompanyId is not null)
    if (newCompanyId && oldCompanyId !== newCompanyId) {
      console.log(`[PATCH] Linking contact ${contactId} to company ${newCompanyId}`);
      
      // Get the company data
      const company = db
        .select()
        .from(companies)
        .where(eq(companies.id, newCompanyId))
        .get();
      
      if (company) {
        // Sync lead data if contact has lead information and it's a lead type
        if (currentContact.type === 'lead' && 
            (currentContact.lead_status || currentContact.lead_temperature || currentContact.lead_source)) {
          
          console.log(`[PATCH] Syncing contact lead data to company ${newCompanyId}`);
          
          const companyUpdateData: any = {
            updated_at: new Date().toISOString()
          };
          
          // Sync lead fields from contact to company
          if (currentContact.lead_status) companyUpdateData.lead_status = currentContact.lead_status;
          if (currentContact.lead_temperature) companyUpdateData.lead_temperature = currentContact.lead_temperature;
          if (currentContact.lead_source) companyUpdateData.lead_source = currentContact.lead_source;
          if (currentContact.lead_owner_id) companyUpdateData.lead_owner_id = currentContact.lead_owner_id;
          if (currentContact.lead_assigned_date) companyUpdateData.lead_assigned_date = currentContact.lead_assigned_date;
          
          // Also sync entity type if contact is a lead
          if (currentContact.type) companyUpdateData.type = currentContact.type;
          
          syncOperations.push(
            db
              .update(companies)
              .set(companyUpdateData)
              .where(eq(companies.id, newCompanyId))
              .run()
          );
        }
        // If contact is not a lead but company is, inherit company lead data
        else if (company.type === 'lead' && currentContact.type !== 'lead') {
          console.log(`[PATCH] Contact inheriting lead data from company ${newCompanyId}`);
          
          const contactUpdateData: any = {
            updated_at: new Date().toISOString()
          };
          
          // Inherit lead fields from company
          if (company.lead_status) contactUpdateData.lead_status = company.lead_status;
          if (company.lead_temperature) contactUpdateData.lead_temperature = company.lead_temperature;
          if (company.lead_source) contactUpdateData.lead_source = company.lead_source;
          if (company.lead_owner_id) contactUpdateData.lead_owner_id = company.lead_owner_id;
          if (company.lead_assigned_date) contactUpdateData.lead_assigned_date = company.lead_assigned_date;
          
          // Also inherit entity type
          if (company.type) contactUpdateData.type = company.type;
          
          syncOperations.push(
            db
              .update(contacts)
              .set(contactUpdateData)
              .where(eq(contacts.id, contactId))
              .run()
          );
        }
      }
    }
    
    // Case 2: Unlinking contact from company (newCompanyId is null and oldCompanyId was not null)
    else if (newCompanyId === null && oldCompanyId !== null) {
      console.log(`[PATCH] Unlinking contact ${contactId} from company ${oldCompanyId}`);
      // When unlinking, preserve the contact's current lead data
      // No additional sync needed - contact keeps its individual status
    }
    
    // Execute all sync operations atomically
    if (syncOperations.length > 0) {
      console.log(`[PATCH] Executing ${syncOperations.length} sync operations`);
      Promise.all(syncOperations);
    }
    
    console.log(`[PATCH] Company association update completed for contact ${contactId}`);
    
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error updating contact company association:', error);
    return NextResponse.json(
      { error: 'Failed to update contact company association' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const contactId = parseInt(id);
  
  // Validate that the ID is a valid integer
  if (isNaN(contactId)) {
    return NextResponse.json(
      { error: 'Invalid contact ID' },
      { status: 400 }
    );
  }
  
  const deleted = db.delete(contacts).where(eq(contacts.id, contactId)).run();
  return NextResponse.json(deleted);
}
