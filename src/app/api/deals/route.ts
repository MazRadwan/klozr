import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/server/services';
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
    const searchQuery = searchParams.get('q');
    const companyId = searchParams.get('company_id');

    const dealService = new DealService();
    
    const result = await dealService.getDeals({
      companyId: companyId ? parseInt(companyId) : undefined,
      searchQuery: searchQuery || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return httpError.internal('Failed to fetch deals');
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
    
    const dealService = new DealService();
    const createdDeal = await dealService.createDeal(body);

    return NextResponse.json(createdDeal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    if (error instanceof z.ZodError) {
      return httpError.badRequest('Validation failed', error.errors);
    }
    return httpError.internal('Failed to create deal');
  }
}
