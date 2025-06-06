import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const searchQuery = searchParams.get('q');
  
  // If search query is provided, search contacts by name and email
  if (searchQuery) {
    const searchTerm = `%${searchQuery}%`;
    const searchResults = db
      .select()
      .from(contacts)
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
    const companyContacts = db
      .select()
      .from(contacts)
      .where(eq(contacts.company_id, parseInt(companyId)))
      .all();
    return NextResponse.json(companyContacts);
  }
  
  // Otherwise, fetch all contacts
  const allContacts = db.select().from(contacts).all();
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
