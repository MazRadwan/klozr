import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, deals, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    // Update only the company association
    const updated = db
      .update(contacts)
      .set({ 
        company_id: company_id === null ? null : parseInt(company_id),
        updated_at: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId))
      .run();
    
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
