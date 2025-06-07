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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dealId = parseInt(id);

    if (isNaN(dealId)) {
      return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 });
    }

    const body = await req.json();

    // Check if deal exists
    const [existingDeal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Extract fields from body
    const {
      title,
      amount,
      stage,
      close_date,
      deal_notes,
      company_id,
      contact_id,
      sales_rep_id,
      offering_id
    } = body;

    // Prepare update data - only include defined fields
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = amount;
    if (stage !== undefined) updateData.stage = stage;
    if (close_date !== undefined) updateData.close_date = close_date;
    if (deal_notes !== undefined) updateData.deal_notes = deal_notes;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (contact_id !== undefined) updateData.contact_id = contact_id;
    if (sales_rep_id !== undefined) updateData.sales_rep_id = sales_rep_id;
    if (offering_id !== undefined) updateData.offering_id = offering_id;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const result = await db
      .update(deals)
      .set(updateData)
      .where(eq(deals.id, dealId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
    }

    // Return the updated deal with associated data
    const updatedDeal = await db
      .select({
        id: deals.id,
        title: deals.title,
        amount: deals.amount,
        stage: deals.stage,
        close_date: deals.close_date,
        created_at: deals.created_at,
        updated_at: deals.updated_at,
        deal_notes: deals.deal_notes,
        contact_id: deals.contact_id,
        company_id: deals.company_id,
        sales_rep_id: deals.sales_rep_id,
        offering_id: deals.offering_id,
        company: {
          id: companies.id,
          name: companies.name,
        },
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
        }
      })
      .from(deals)
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(eq(deals.id, dealId))
      .limit(1);

    return NextResponse.json(updatedDeal[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
