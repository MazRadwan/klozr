import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const searchQuery = searchParams.get('q');
  const includeCompany = searchParams.get('include_company') === 'true';
  
  // Base query structure
  const baseQuery = includeCompany 
    ? db
        .select({
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
          is_primary: contacts.is_primary,
          // Lead management fields
          individual_lead_status: contacts.individual_lead_status,
          is_lead_contact: contacts.is_lead_contact,
          lead_source: contacts.lead_source,
          lead_assigned_date: contacts.lead_assigned_date,
          lead_owner_id: contacts.lead_owner_id,
          created_at: contacts.created_at,
          updated_at: contacts.updated_at,
          // Company information
          company: {
            id: companies.id,
            name: companies.name,
            lead_status: companies.lead_status,
            type: companies.type,
          }
        })
        .from(contacts)
        .leftJoin(companies, eq(contacts.company_id, companies.id))
    : db.select().from(contacts);
  
  // If search query is provided, search contacts by name and email
  if (searchQuery) {
    const searchTerm = `%${searchQuery}%`;
    const searchResults = baseQuery
      .where(
        or(
          like(contacts.first_name, searchTerm),
          like(contacts.last_name, searchTerm),
          like(contacts.email, searchTerm)
        )
      )
      .limit(20) // Limit search results
      .all();
    return NextResponse.json(searchResults);
  }
  
  // If company_id is provided, filter contacts by that company
  if (companyId) {
    const companyContacts = baseQuery
      .where(eq(contacts.company_id, parseInt(companyId)))
      .all();
    return NextResponse.json(companyContacts);
  }
  
  // Otherwise, fetch all contacts
  const allContacts = baseQuery.all();
  return NextResponse.json(allContacts);
}

import { z } from 'zod';

const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  contact_type: z.string().optional(),
  company_id: z.number().optional(),
  owner_user_id: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  created_at: z.string().optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = contactSchema.parse(body);
  const inserted = db.insert(contacts).values(validated).run();
  return NextResponse.json(inserted, { status: 201 });
}
