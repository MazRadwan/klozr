import { NextRequest, NextResponse } from 'next/server';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeActivityService } from '@/server/services';
import { parseUpdateActivityInput } from '@/server/validation';

export const GET = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const activityId = parseInt(id);
  
  if (isNaN(activityId)) {
    throwError.badRequest('Invalid activity ID');
  }
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const includeParticipants = searchParams.get('include_participants') === 'true';
    const includeUser = searchParams.get('include_user') !== 'false'; // Default true
    
    const activityService = makeActivityService();
    const activity = await activityService.getActivityById(activityId, {
      includeParticipants,
      includeUser
    });
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throwError.notFound('Activity not found');
    }
    throwError.internal('Failed to fetch activity');
  }
});

export const PUT = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const activityId = parseInt(id);
  
  if (isNaN(activityId)) {
    throwError.badRequest('Invalid activity ID');
  }
  
  try {
    const body = await req.json();
    const validatedData = parseUpdateActivityInput(body);
    
    const activityService = makeActivityService();
    const activity = await activityService.updateActivity(activityId, validatedData);
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throwError.notFound('Activity not found');
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        throwError.badRequest(error.message);
      }
    }
    throwError.internal('Failed to update activity');
  }
});

export const DELETE = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const activityId = parseInt(id);
  
  if (isNaN(activityId)) {
    throwError.badRequest('Invalid activity ID');
  }
  
  try {
    const activityService = makeActivityService();
    const deleted = await activityService.deleteActivity(activityId);
    
    if (!deleted) {
      throwError.notFound('Activity not found');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    throwError.internal('Failed to delete activity');
  }
});