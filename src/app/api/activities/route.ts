import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler, throwError } from '@/server/lib';
import { makeActivityService } from '@/server/services';
import { parseCreateActivityInput, parseActivityQueryParams } from '@/server/validation';

export const GET = withAuthHandler(async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = parseActivityQueryParams(searchParams);
    
    const activityService = makeActivityService();
    const activities = await activityService.getAllActivities({
      activityType: queryParams.activity_type,
      status: queryParams.status,
      searchQuery: queryParams.q, // Add search parameter
      limit: queryParams.limit,
      offset: queryParams.offset,
      includeParticipants: queryParams.include_participants,
      includeUser: queryParams.include_user
    });
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    if (error instanceof Error && error.message.includes('Invalid')) {
      throwError.badRequest(error.message);
    }
    throwError.internal('Failed to fetch activities');
  }
});

export const POST = withAuthHandler(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = parseCreateActivityInput(body);
    
    const activityService = makeActivityService();
    const activity = await activityService.createActivity(validatedData);
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throwError.notFound(error.message);
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        throwError.badRequest(error.message);
      }
    }
    throwError.internal('Failed to create activity');
  }
});