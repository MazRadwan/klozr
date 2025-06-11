import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }
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
          lead_status: contacts.lead_status,
          lead_temperature: contacts.lead_temperature,
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
            lead_source: companies.lead_source,
            lead_temperature: companies.lead_temperature,
            lead_owner_id: companies.lead_owner_id,
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
  company_id: z.number().nullable().optional(),
  owner_user_id: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  is_primary: z.boolean().optional(),
  type: z.string().optional(),
  created_at: z.string().optional()
});

export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const body = await req.json();
    console.log('Contact creation request body:', body);
    
    const validated = contactSchema.parse(body);
    console.log('Validated contact data:', validated);
    
    const inserted = db.insert(contacts).values(validated).run();
    console.log('Contact created successfully:', inserted);
    
    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('Contact creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact', details: error.message },
      { status: 500 }
    );
  }
}
