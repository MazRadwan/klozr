import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await req.json();
    const { type } = body;

    // Get the current contact with company info
    const currentContact = await db
      .select({
        contact: contacts,
        company: companies
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (currentContact.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contact = currentContact[0].contact;
    const company = currentContact[0].company;

    // Update the contact's type
    await db
      .update(contacts)
      .set({ 
        type: type,
        updated_at: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId));

    // Auto-sync logic: If contact has a company and we're setting the contact type,
    // and the company doesn't have a type, set the company type
    if (company && type && !company.type) {
      await db
        .update(companies)
        .set({
          type: type,
          updated_at: new Date().toISOString()
        })
        .where(eq(companies.id, company.id));
    }

    // Return the updated contact
    const updatedContact = await db
      .select({
        contact: contacts,
        company: companies
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    return NextResponse.json(updatedContact[0]);
  } catch (error) {
    console.error('Error updating contact type:', error);
    return NextResponse.json(
      { error: 'Failed to update contact type' },
      { status: 500 }
    );
  }
} 