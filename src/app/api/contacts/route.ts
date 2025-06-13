import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/server/services';
import { requireAuth, isAuthError } from '@/server/lib';
import { httpError } from '@/server/lib';

export async function GET(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const searchQuery = searchParams.get('q');
    const includeCompany = searchParams.get('include_company') === 'true';
    
    const contactService = new ContactService();
    
    const result = await contactService.getContacts({
      companyId: companyId ? parseInt(companyId) : undefined,
      searchQuery: searchQuery || undefined,
      includeCompany,
      limit: 20
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return httpError.internal('Failed to fetch contacts');
  }
}

import { z } from 'zod';

const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  contact_type: z.string().optional(),
  company_id: z.number().nullable().optional(),
  owner_user_id: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  is_primary: z.boolean().optional(),
  type: z.string().optional(),
  // Lead fields for bi-directional sync inheritance
  lead_status: z.string().nullable().optional(),
  lead_temperature: z.string().nullable().optional(),
  lead_source: z.string().nullable().optional(),
  lead_owner_id: z.number().nullable().optional(),
  lead_assigned_date: z.string().nullable().optional(),
  created_at: z.string().optional()
});

export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const body = await req.json();
    console.log('Contact creation request body:', body);
    
    const validated = contactSchema.parse(body);
    console.log('Validated contact data:', validated);
    
    // Inherit lead fields from company if company_id is provided
    let contactData = { ...validated };
    
    if (validated.company_id) {
      console.log('Contact has company_id, checking for lead inheritance:', validated.company_id);
      
      // Fetch company data to inherit lead fields
      const company = db
        .select()
        .from(companies)
        .where(eq(companies.id, validated.company_id))
        .limit(1)
        .all();
      
      if (company.length > 0 && company[0].type === 'lead') {
        console.log('Company is a lead, inheriting lead fields:', {
          companyType: company[0].type,
          leadStatus: company[0].lead_status,
          leadTemperature: company[0].lead_temperature,
          leadSource: company[0].lead_source
        });
        
        // Inherit company's lead fields for bi-directional sync
        contactData = {
          ...contactData,
          type: company[0].type,
          lead_status: company[0].lead_status,
          lead_temperature: company[0].lead_temperature,
          lead_source: company[0].lead_source,
          lead_owner_id: company[0].lead_owner_id,
          lead_assigned_date: company[0].lead_assigned_date
        };
      }
    }
    
    const inserted = db.insert(contacts).values(contactData).run();
    console.log('Contact created successfully with inherited lead data:', inserted);
    
    // Return the complete contact data including the new ID
    const newContact = db
      .select()
      .from(contacts)
      .where(eq(contacts.id, inserted.lastInsertRowid as number))
      .limit(1)
      .all()[0];
    
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Contact creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
