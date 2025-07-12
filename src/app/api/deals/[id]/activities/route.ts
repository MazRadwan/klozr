import { NextRequest, NextResponse } from 'next/server';
import { throwError, requireAuth, isAuthError } from '@/server/lib';
import { makeActivityService } from '@/server/services';
import { parseCreateNoteInput, parseLogCallInput, parseActivityQueryParams } from '@/server/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }
  
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = parseActivityQueryParams(searchParams);
    
    const activityService = makeActivityService();
    const activities = await activityService.getActivitiesForEntity('deal', dealId, {
      activityType: queryParams.activity_type,
      status: queryParams.status,
      searchQuery: queryParams.q, // Add search parameter
      sortBy: queryParams.sort_by, // Add sort field parameter
      sortOrder: queryParams.sort_order, // Add sort order parameter
      limit: queryParams.limit,
      offset: queryParams.offset,
      includeParticipants: queryParams.include_participants,
      includeUser: queryParams.include_user
    });
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching deal activities:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      throwError.notFound('Deal not found');
    }
    throwError.internal('Failed to fetch deal activities');
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }
  
  const { id } = await params;
  const dealId = parseInt(id);
  
  if (isNaN(dealId)) {
    throwError.badRequest('Invalid deal ID');
  }
  
  try {
    const body = await req.json();
    const activityService = makeActivityService();
    const authenticatedUserId = parseInt(authResult.user.id!);
    
    // Determine activity type from request and handle accordingly
    const activityType = body.activity_type || body.type;
    
    let activity;
    
    switch (activityType) {
      case 'note':
        const noteData = parseCreateNoteInput(body);
        activity = await activityService.createNote(
          'deal',
          dealId,
          noteData.content,
          authenticatedUserId,
          noteData.title
        );
        break;
        
      case 'call':
        const callData = parseLogCallInput(body);
        activity = await activityService.logCall(
          'deal',
          dealId,
          {
            duration: callData.duration,
            outcome: callData.outcome,
            notes: callData.content,
            sentiment: callData.sentiment,
            followUpRequired: callData.followUpRequired
          },
          authenticatedUserId
        );
        break;
        
      default:
        // For other activity types, use the general create method
        const activityData = {
          activity_type: activityType,
          primary_entity_type: 'deal' as const,
          primary_entity_id: dealId,
          user_id: authenticatedUserId,
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
    console.error('Error creating deal activity:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throwError.notFound(error.message);
      }
      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('undefined')) {
        throwError.badRequest(error.message);
      }
    }
    throwError.internal('Failed to create deal activity');
  }
}