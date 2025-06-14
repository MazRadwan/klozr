import { NextRequest, NextResponse } from 'next/server';
import { makeCompanyService } from '@/server/services';
import { withAuthHandler } from '@/server/lib';

export const GET = withAuthHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  
  const companyService = makeCompanyService();
  const result = await companyService.getCompanies(query || undefined);
  
  return NextResponse.json(result);
});

export const POST = withAuthHandler(async (req: NextRequest) => {
  const body = await req.json();
  console.log('Company creation request body:', body);
  
  // Use CompanyService for creation with contact assignment and bi-directional sync
  const companyService = makeCompanyService();
  
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
}); 