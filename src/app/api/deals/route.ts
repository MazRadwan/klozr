import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, contacts, companies, offerings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    // Fetch all deals with related data using joins
    const allDeals = db
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
      .all();

    return NextResponse.json(allDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

const dealSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().optional(),
  stage: z.string().optional(),
  close_date: z.string().optional(),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  sales_rep_id: z.string().optional(),
  offering_id: z.string().optional(),
  deal_notes: z.string().optional(),
  created_at: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = dealSchema.parse(body);
    
    const inserted = db.insert(deals).values(validated).run();
    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
