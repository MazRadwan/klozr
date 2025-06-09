import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offerings } from '@/lib/schema';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const allOfferings = db.select().from(offerings).all();
    return NextResponse.json(allOfferings);
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return NextResponse.json({ error: 'Failed to fetch offerings' }, { status: 500 });
  }
} 