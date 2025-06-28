import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/server/lib';
import { makeActivityService } from '@/server/services';
import { parseCreateNoteInput, parseLogCallInput, parseActivityQueryParams } from '@/server/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
  }
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = parseActivityQueryParams(searchParams);
    
    const activityService = makeActivityService();
    const activities = await activityService.getActivitiesForEntity('company', companyId, {
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
    console.error('Error fetching company activities:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch company activities' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication and get user ID
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }
  const authenticatedUserId = parseInt(authResult.user.id!);
  
  console.log('=== COMPANY ACTIVITY CREATION DEBUG ===');
  console.log('Authenticated user ID:', authenticatedUserId);
  console.log('Authenticated user email:', authResult.user.email);
  console.log('Authenticated user name:', authResult.user.name);
  console.log('========================================');

  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
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
          authenticatedUserId,
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
          authenticatedUserId
        );
        break;
        
      default:
        // For other activity types, use the general create method
        const activityData = {
          activity_type: activityType,
          primary_entity_type: 'company' as const,
          primary_entity_id: companyId,
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
    console.error('Error creating company activity:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to create company activity' }, { status: 500 });
  }
}