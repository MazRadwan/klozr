import { NextRequest, NextResponse } from 'next/server';
import { makeDealService } from '@/server/services';
import { withAuthHandler } from '@/server/lib';

export const GET = withAuthHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('q');
  const companyId = searchParams.get('company_id');

  const dealService = makeDealService();
  
  const result = await dealService.getDeals({
    companyId: companyId ? parseInt(companyId) : undefined,
    searchQuery: searchQuery || undefined
  });

  return NextResponse.json(result);
});

export const POST = withAuthHandler(async (req: NextRequest) => {
  const body = await req.json();
  
  const dealService = makeDealService();
  const createdDeal = await dealService.createDeal(body);

  return NextResponse.json(createdDeal, { status: 201 });
});
