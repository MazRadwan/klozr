import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, contacts, companies, offerings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);
    
    // Validate that the ID is a valid integer
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }
    
    const deal = db
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(eq(deals.id, dealId))
      .get();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);
    
    // Validate that the ID is a valid integer
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const result = db.update(deals).set(body).where(eq(deals.id, dealId)).run();
    
    // Fetch the updated deal with related data
    const updatedDeal = db
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(eq(deals.id, dealId))
      .get();

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);
    
    // Validate that the ID is a valid integer
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }
    
    const deleted = db.delete(deals).where(eq(deals.id, dealId)).run();
    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
