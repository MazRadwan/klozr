import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    const body = await req.json();
    const { type } = body;

    // Check if company exists
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update the company's type
    await db
      .update(companies)
      .set({ 
        type: type,
        updated_at: new Date().toISOString()
      })
      .where(eq(companies.id, companyId));

    // Auto-sync logic: When company type changes, update all related contacts
    // The hybrid inheritance system means contacts should inherit from company
    // We'll update all contacts to match the company type since inheritance
    // is handled in the frontend display logic
    console.log(`[Company Type Update] Updating company ${companyId} to type: ${type}`);
    
    // First, let's see how many contacts are affected
    const relatedContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.company_id, companyId));
    
    console.log(`[Company Type Update] Found ${relatedContacts.length} related contacts:`, relatedContacts.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, currentType: c.type })));
    
    const updateResult = await db
      .update(contacts)
      .set({ 
        type: type,
        updated_at: new Date().toISOString()
      })
      .where(eq(contacts.company_id, companyId));
      
    console.log(`[Company Type Update] Update completed. Result:`, updateResult);

    // Return the updated company
    const updatedCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    return NextResponse.json(updatedCompany[0]);
  } catch (error) {
    console.error('Error updating company type:', error);
    return NextResponse.json(
      { error: 'Failed to update company type' },
      { status: 500 }
    );
  }
} 