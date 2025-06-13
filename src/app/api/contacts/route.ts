import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/server/services';
import { withAuthHandler } from '@/server/lib';

export const GET = withAuthHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const searchQuery = searchParams.get('q');
  const includeCompany = searchParams.get('include_company') === 'true';
  
  const contactService = new ContactService();
  
  const result = await contactService.getContacts({
    companyId: companyId ? parseInt(companyId) : undefined,
    searchQuery: searchQuery || undefined,
    includeCompany,
    limit: 20
  });
  
  return NextResponse.json(result);
});

export const POST = withAuthHandler(async (req: NextRequest) => {
  const body = await req.json();
  console.log('Contact creation request body:', body);
  
  // Use ContactService for creation with company association and bi-directional sync
  const contactService = new ContactService();
  
  // Validate and create contact
  const validated = contactService.validateContactInput(body);
  const result = await contactService.createWithCompanyAssociation(validated);

  if (!result.success) {
    console.error('Contact creation failed:', result.error);
    return NextResponse.json(
      { error: 'Failed to create contact', details: result.error },
      { status: 500 }
    );
  }
  
  console.log('Contact creation completed successfully via service');
  return NextResponse.json(result.contact, { status: 201 });
});
