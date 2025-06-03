import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, deals, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contactId = params.id;
    
    // Get contact details with company information
    const contactResult = db.select({
      contact: {
        id: contacts.id,
        first_name: contacts.first_name,
        last_name: contacts.last_name,
        email: contacts.email,
        phone: contacts.phone,
        contact_type: contacts.contact_type,
        address: contacts.address,
        city: contacts.city,
        state_province: contacts.state_province,
        postal_code: contacts.postal_code,
        created_at: contacts.created_at,
      },
      company: {
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
        state: companies.state,
        country: companies.country,
        phone: companies.phone,
        website: companies.website,
      }
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.company_id, companies.id))
    .where(eq(contacts.id, contactId))
    .get();

    if (!contactResult) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get related deals for this contact
    const relatedDeals = db.select({
      deal: {
        id: deals.id,
        title: deals.title,
        amount: deals.amount,
        stage: deals.stage,
        close_date: deals.close_date,
        created_at: deals.created_at,
      },
      company: {
        id: companies.id,
        name: companies.name,
      }
    })
    .from(deals)
    .leftJoin(companies, eq(deals.company_id, companies.id))
    .where(eq(deals.contact_id, contactId))
    .all();

    const response = {
      ...contactResult,
      relatedDeals: relatedDeals
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const updated = db.update(contacts).set(body).where(eq(contacts.id, id)).run();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const deleted = db.delete(contacts).where(eq(contacts.id, id)).run();
  return NextResponse.json(deleted);
}
