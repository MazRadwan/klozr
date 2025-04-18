import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = db.select().from(customers).where(eq(customers.id, params.id)).get();
  if (!result) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = db.update(customers).set(body).where(eq(customers.id, params.id)).run();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const deleted = db.delete(customers).where(eq(customers.id, params.id)).run();
  return NextResponse.json(deleted);
}
