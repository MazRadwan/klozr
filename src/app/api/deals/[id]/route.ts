import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = db.select().from(deals).where(eq(deals.id, params.id)).get();
  if (!result) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = db.update(deals).set(body).where(eq(deals.id, params.id)).run();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const deleted = db.delete(deals).where(eq(deals.id, params.id)).run();
  return NextResponse.json(deleted);
}
