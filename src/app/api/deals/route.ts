import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@/lib/schema';

export async function GET(_req: NextRequest) {
  const all = db.select().from(deals).all();
  return NextResponse.json(all);
}

import { z } from 'zod';

const dealSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  amount: z.number(),
  stage: z.string().min(1),
  probability: z.number().min(0).max(1),
  closeDate: z.string(),
  customerId: z.string()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = dealSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Validation failed', details: parse.error.errors }, { status: 400 });
  }
  const inserted = db.insert(deals).values(parse.data).run();
  return NextResponse.json(inserted, { status: 201 });
}
