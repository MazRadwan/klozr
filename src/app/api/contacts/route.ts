import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Fetch all contacts
  const all = db.select().from(contacts).all();
  return NextResponse.json(all);
}

import { z } from 'zod';

const contactSchema = z.object({
  id: z.string(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  contact_type: z.string(),
  company_id: z.string(),
  owner_user_id: z.string(),
  address: z.string(),
  city: z.string(),
  state_province: z.string(),
  postal_code: z.string(),
  createdAt: z.string()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = contactSchema.parse(body);
  const inserted = db.insert(contacts).values(validated).run();
  return NextResponse.json(inserted, { status: 201 });
}
