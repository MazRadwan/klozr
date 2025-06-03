import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offerings } from '@/lib/schema';

export async function GET(req: NextRequest) {
  try {
    const allOfferings = db.select().from(offerings).all();
    return NextResponse.json(allOfferings);
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return NextResponse.json({ error: 'Failed to fetch offerings' }, { status: 500 });
  }
} 