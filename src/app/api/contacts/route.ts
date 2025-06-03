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
  phone: z.string().optional(),
  contact_type: z.string().optional(),
  company_id: z.string().optional(),
  owner_user_id: z.string().optional(),
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
