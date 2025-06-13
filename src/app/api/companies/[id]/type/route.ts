import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
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
    const { type } = body;
    
    console.log(`[Company Type Update] Request for company ${companyId}:`, { type });

    // Check if company exists
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const company = existingCompany[0];
    console.log(`[Company Type Update] Found company:`, {
      id: company.id,
      name: company.name,
      current_type: company.type
    });

    // Use LeadSyncService for bi-directional type update
    const leadSyncService = new LeadSyncService();
    const result = await leadSyncService.updateCompanyType(companyId, type);

    if (!result.success) {
      console.error(`[Company Type Update] Service failed for company ${companyId}:`, result.error);
      return NextResponse.json({ 
        error: 'Failed to update entity type', 
        details: result.error 
      }, { status: 500 });
    }

    console.log(`[Company Type Update] Successfully updated company ${companyId} and all related contacts via service`);

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