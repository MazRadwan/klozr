import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
import { like, or } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    let allCompanies;
    
    if (query) {
      // Search companies by name, phone, email, or website
      allCompanies = db.select().from(companies)
        .where(
          or(
            like(companies.name, `%${query}%`),
            like(companies.phone, `%${query}%`),
            like(companies.email, `%${query}%`),
            like(companies.website, `%${query}%`)
          )
        )
        .all();
    } else {
      allCompanies = db.select().from(companies).all();
    }
    
    return NextResponse.json(allCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const body = await req.json();
    
    const newCompany = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    db.insert(companies).values(newCompany).run();
    
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
} 