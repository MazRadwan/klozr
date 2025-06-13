import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';
import { LeadSyncService } from '@/server/services/LeadSyncService';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, temperature, source, ownerId } = body;

    // Check if company exists and get its current type
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Use LeadSyncService for bi-directional lead data update
    const leadSyncService = new LeadSyncService();
    const result = await leadSyncService.updateCompanyLeadData(companyId, {
      status,
      temperature, 
      source,
      ownerId
    });

    if (!result.success) {
      console.error(`[Company Lead Update] Service failed for company ${companyId}:`, result.error);
      return NextResponse.json({ 
        error: 'Failed to update lead data', 
        details: result.error 
      }, { status: 500 });
    }

    // Return the updated company with related contacts
    const updatedCompany = await db
      .select({
        company: companies,
        contacts: contacts
      })
      .from(companies)
      .leftJoin(contacts, eq(companies.id, contacts.company_id))
      .where(eq(companies.id, companyId));

    // Group the results properly
    const updatedCompanyData = updatedCompany[0]?.company;
    const relatedContacts = updatedCompany
      .filter(row => row.contacts !== null)
      .map(row => row.contacts);

    return NextResponse.json({
      company: updatedCompanyData,
      contacts: relatedContacts
    });
  } catch (error) {
    console.error('Error updating company lead status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}