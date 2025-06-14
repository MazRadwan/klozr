import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/server/lib';
import { makeOfferingService } from '@/server/services';

export const GET = withAuthHandler(async (req: NextRequest) => {
  const offeringService = makeOfferingService();
  const offerings = await offeringService.getOfferings();
  return NextResponse.json(offerings);
});