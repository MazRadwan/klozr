import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/server/services';
import { requireAuth, isAuthError } from '@/server/lib';
import { httpError } from '@/server/lib';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
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
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return httpError.internal('Failed to fetch contacts');
  }
}

import { z } from 'zod';

export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
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
    
  } catch (error) {
    console.error('Contact creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
