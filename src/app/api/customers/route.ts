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

const customerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  status: z.enum(['Active', 'Inactive']),
  createdAt: z.string()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: Add contacts validation schema if needed
  const inserted = db.insert(contacts).values(body).run();
  return NextResponse.json(inserted, { status: 201 });
}
