import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeLeadSyncService } from '@/server/services';

export const PATCH = withAuthParamsHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
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
    throwError.notFound('Company not found');
  }
  
  const company = existingCompany[0];
  console.log(`[Company Type Update] Found company:`, {
    id: company.id,
    name: company.name,
    current_type: company.type
  });

  // Use LeadSyncService for bi-directional type update
  const leadSyncService = makeLeadSyncService();
  const result = await leadSyncService.updateCompanyType(companyId, type);

  if (!result.success) {
    console.error(`[Company Type Update] Service failed for company ${companyId}:`, result.error);
    throwError.internal(`Failed to update entity type: ${result.error}`);
  }

  console.log(`[Company Type Update] Successfully updated company ${companyId} and all related contacts via service`);

  // Return the updated company
  const updatedCompany = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return NextResponse.json(updatedCompany[0]);
}); 