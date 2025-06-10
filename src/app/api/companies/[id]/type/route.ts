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

    // Prepare company update data
    const companyUpdateData: any = {
      type: type,
      updated_at: new Date().toISOString()
    };

    // Clear lead fields if transitioning away from 'lead' type
    if (type && type !== 'lead') {
      companyUpdateData.lead_status = null;
      companyUpdateData.lead_temperature = null;
      companyUpdateData.lead_source = null;
      companyUpdateData.lead_assigned_date = null;
      companyUpdateData.lead_owner_id = null;
    }

    // Update the company's type
    await db
      .update(companies)
      .set(companyUpdateData)
      .where(eq(companies.id, companyId));

    // Prepare contacts update data (same as company)
    const contactsUpdateData: any = {
      type: type,
      updated_at: new Date().toISOString()
    };

    // Clear lead fields for contacts too if transitioning away from 'lead'
    if (type && type !== 'lead') {
      contactsUpdateData.lead_status = null;
      contactsUpdateData.lead_temperature = null;
      contactsUpdateData.lead_source = null;
      contactsUpdateData.lead_assigned_date = null;
      contactsUpdateData.lead_owner_id = null;
      contactsUpdateData.individual_lead_status = null;
      contactsUpdateData.is_lead_contact = false;
    }

    // Auto-sync logic: When company type changes, update all related contacts
    await db
      .update(contacts)
      .set(contactsUpdateData)
      .where(eq(contacts.company_id, companyId));

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