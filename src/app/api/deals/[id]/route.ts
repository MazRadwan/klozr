import { NextRequest, NextResponse } from 'next/server';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeDealService } from '@/server/services';

export const GET = withAuthParamsHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  const dealService = makeDealService();
  const deal = await dealService.getDealById(dealId);
  
  if (!deal) {
    throwError.notFound('Deal not found');
  }
  
  return NextResponse.json(deal);
});

export const PUT = withAuthParamsHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  const body = await req.json();
  const dealService = makeDealService();
  
  const result = await dealService.updateDeal(dealId, body);
  
  if (!result) {
    throwError.notFound('Deal not found');
  }
  
  return NextResponse.json(result);
});

export const PATCH = withAuthParamsHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  const body = await req.json();
  const dealService = makeDealService();
  
  const result = await dealService.updateDealWithAutoSync(dealId, body);
  
  if (!result.success) {
    if (result.error === 'Deal not found') {
      throwError.notFound('Deal not found');
    }
    throwError.internal(`Failed to update deal: ${result.error}`);
  }
  
  return NextResponse.json(result.deal);
});

export const DELETE = withAuthParamsHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  const dealService = makeDealService();
  const result = await dealService.deleteDeal(dealId);
  
  if (!result) {
    throwError.notFound('Deal not found');
  }
  
  return NextResponse.json(result);
});