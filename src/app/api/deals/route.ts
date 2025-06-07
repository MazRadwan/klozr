import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, contacts, companies, offerings } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('q');
    const companyId = searchParams.get('company_id');

    // Base query setup
    const baseQuery = db
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
      .leftJoin(offerings, eq(deals.offering_id, offerings.id));

    // Apply filters and execute query
    let result;
    if (companyId) {
      result = baseQuery.where(eq(deals.company_id, parseInt(companyId))).all();
    } else if (searchQuery) {
      result = baseQuery.where(
        or(
          like(deals.title, `%${searchQuery}%`),
          like(companies.name, `%${searchQuery}%`),
          like(deals.deal_notes, `%${searchQuery}%`)
        )
      ).all();
    } else {
      result = baseQuery.all();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().optional(),
  stage: z.string().optional(),
  close_date: z.string().optional(),
  contact_id: z.number().optional(),
  company_id: z.number().optional(),
  sales_rep_id: z.number().optional(),
  offering_id: z.number().optional(),
  deal_notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = dealSchema.parse(body);
    
    const result = db.insert(deals).values(validated).returning({ id: deals.id }).get();
    
    // Fetch the created deal with related data
    const createdDeal = db
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
      .where(eq(deals.id, result.id))
      .get();

    return NextResponse.json(createdDeal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
