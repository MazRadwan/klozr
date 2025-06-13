import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/server/services';
import { requireAuth, isAuthError } from '@/server/lib';
import { httpError } from '@/server/lib';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    const companyService = new CompanyService();
    
    const result = await companyService.getCompanies(query || undefined);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return httpError.internal('Failed to fetch companies');
  }
}


export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const body = await req.json();
    console.log('Company creation request body:', body);
    
    // Use CompanyService for creation with contact assignment and bi-directional sync
    const companyService = new CompanyService();
    
    // Validate and create company
    const validated = companyService.validateCompanyInput(body);
    const result = await companyService.createWithContactAssignment(validated);

    if (!result.success) {
      console.error('Company creation failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to create company', details: result.error },
        { status: 500 }
      );
    }
    
    console.log('Company creation completed successfully via service');
    return NextResponse.json(result.company, { status: 201 });
    
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 