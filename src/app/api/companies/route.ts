import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { like, or, eq } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth-guard';
import { z } from 'zod';

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

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  employees: z.number().optional(),
  revenue: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  assignContacts: z.array(z.number()).optional()
});

export async function POST(req: NextRequest) {
  // Check authentication first
  const authResult = await requireAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  try {
    const body = await req.json();
    console.log('Company creation request body:', body);
    
    // Validate request data
    const validated = companySchema.parse(body);
    const { assignContacts, ...companyData } = validated;
    
    console.log('Validated company data:', companyData);
    console.log('Contacts to assign:', assignContacts);
    
    // Use transaction for atomic company creation + contact assignment
    const result = await db.transaction(async (tx) => {
      // Create company first
      const newCompany = {
        ...companyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const [company] = await tx
        .insert(companies)
        .values(newCompany)
        .returning({ 
          id: companies.id,
          name: companies.name,
          email: companies.email,
          phone: companies.phone,
          website: companies.website
        });
      
      console.log('Company created:', company);
      
      // If contacts are provided, assign them to the company
      if (assignContacts && assignContacts.length > 0) {
        console.log(`Assigning ${assignContacts.length} contacts to company ${company.id}`);
        
        // Get contact data for potential bi-directional sync
        const contactsToUpdate = await tx
          .select()
          .from(contacts)
          .where(or(...assignContacts.map(id => eq(contacts.id, id))));
        
        console.log('Contacts found for assignment:', contactsToUpdate.length);
        
        // Update contacts with company_id
        const contactUpdates = assignContacts.map(contactId => 
          tx
            .update(contacts)
            .set({ 
              company_id: company.id,
              updated_at: new Date().toISOString()
            })
            .where(eq(contacts.id, contactId))
            .run()
        );
        
        await Promise.all(contactUpdates);
        console.log('Contact assignments completed');
        
        // Bi-directional sync: If any assigned contacts have lead data and company doesn't have type,
        // inherit lead data from the first contact with lead information
        const leadContact = contactsToUpdate.find(c => 
          c.type === 'lead' && (c.lead_status || c.lead_temperature || c.lead_source)
        );
        
        if (leadContact && !companyData.type) {
          console.log(`Inheriting lead data from contact ${leadContact.id}`);
          
          const companyUpdateData: any = {
            updated_at: new Date().toISOString()
          };
          
          // Inherit lead fields from contact
          if (leadContact.lead_status) companyUpdateData.lead_status = leadContact.lead_status;
          if (leadContact.lead_temperature) companyUpdateData.lead_temperature = leadContact.lead_temperature;
          if (leadContact.lead_source) companyUpdateData.lead_source = leadContact.lead_source;
          if (leadContact.lead_owner_id) companyUpdateData.lead_owner_id = leadContact.lead_owner_id;
          if (leadContact.lead_assigned_date) companyUpdateData.lead_assigned_date = leadContact.lead_assigned_date;
          if (leadContact.type) companyUpdateData.type = leadContact.type;
          
          await tx
            .update(companies)
            .set(companyUpdateData)
            .where(eq(companies.id, company.id))
            .run();
          
          console.log('Company lead data inherited from contact');
          
          // Update the returned company object with inherited data
          Object.assign(company, companyUpdateData);
        }
      }
      
      return company;
    });
    
    console.log('Company creation transaction completed successfully');
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 