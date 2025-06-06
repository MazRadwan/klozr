import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET individual company
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = db.select().from(companies).where(eq(companies.id, id)).get();
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

// UPDATE company
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updatedData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    const result = db
      .update(companies)
      .set(updatedData)
      .where(eq(companies.id, id))
      .run();
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Return updated company
    const updatedCompany = db.select().from(companies).where(eq(companies.id, id)).get();
    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

// DELETE company
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = db.delete(companies).where(eq(companies.id, id)).run();
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
} 