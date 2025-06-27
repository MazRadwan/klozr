import { NextRequest, NextResponse } from 'next/server';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeActivityService } from '@/server/services';
import { parseCreateNoteInput, parseLogCallInput, parseActivityQueryParams } from '@/server/validation';

export const GET = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
  }
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = parseActivityQueryParams(searchParams);
    
    const activityService = makeActivityService();
    const activities = await activityService.getActivitiesForEntity('company', companyId, {
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
    console.error('Error fetching company activities:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throwError.notFound('Company not found');
    }
    throwError.internal('Failed to fetch company activities');
  }
});

export const POST = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
  }
  
  try {
    const body = await req.json();
    const activityService = makeActivityService();
    
    // Determine activity type from request and handle accordingly
    const activityType = body.activity_type || body.type;
    
    let activity;
    
    switch (activityType) {
      case 'note':
        const noteData = parseCreateNoteInput(body);
        activity = await activityService.createNote(
          'company',
          companyId,
          noteData.content,
          noteData.user_id,
          noteData.title
        );
        break;
        
      case 'call':
        const callData = parseLogCallInput(body);
        activity = await activityService.logCall(
          'company',
          companyId,
          {
            duration: callData.duration,
            outcome: callData.outcome,
            notes: callData.content,
            sentiment: callData.sentiment,
            followUpRequired: callData.followUpRequired
          },
          callData.user_id
        );
        break;
        
      default:
        // For other activity types, use the general create method
        const activityData = {
          activity_type: activityType,
          primary_entity_type: 'company' as const,
          primary_entity_id: companyId,
          user_id: body.user_id,
          title: body.title,
          content: body.content,
          data: body.data,
          status: body.status || 'completed',
          scheduled_at: body.scheduled_at
        };
        
        activity = await activityService.createActivity(activityData);
        break;
    }
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating company activity:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throwError.notFound(error.message);
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        throwError.badRequest(error.message);
      }
    }
    throwError.internal('Failed to create company activity');
  }
});