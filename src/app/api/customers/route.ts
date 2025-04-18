import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Fetch all customers
  const all = db.select().from(customers).all();
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
  const parse = customerSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Validation failed', details: parse.error.errors }, { status: 400 });
  }
  const inserted = db.insert(customers).values(parse.data).run();
  return NextResponse.json(inserted, { status: 201 });
}
