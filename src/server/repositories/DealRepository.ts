import { db } from '@/lib/db';
import { deals, contacts, companies, offerings } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';

export class DealRepository {
  constructor(private readonly database = db) {}

  /**
   * Find all deals with related data
   */
  findAll() {
    return this.database
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .all();
  }

  /**
   * Find deals by company ID
   */
  findByCompany(companyId: number) {
    return this.database
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(eq(deals.company_id, companyId))
      .all();
  }

  /**
   * Search deals by title, company name, or notes
   */
  search(searchTerm: string) {
    const searchPattern = `%${searchTerm}%`;
    
    return this.database
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(
        or(
          like(deals.title, searchPattern),
          like(companies.name, searchPattern),
          like(deals.deal_notes, searchPattern)
        )
      )
      .all();
  }

  /**
   * Find deal by ID with related data
   */
  findById(id: number) {
    const result = this.database
      .select({
        deal: deals,
        contact: {
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          email: contacts.email,
          phone: contacts.phone,
          address: contacts.address,
          city: contacts.city,
          state_province: contacts.state_province,
          postal_code: contacts.postal_code,
        },
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
        },
        offering: {
          id: offerings.id,
          name: offerings.name,
          type: offerings.type,
          description: offerings.description,
          price: offerings.price,
        },
      })
      .from(deals)
      .leftJoin(contacts, eq(deals.contact_id, contacts.id))
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .leftJoin(offerings, eq(deals.offering_id, offerings.id))
      .where(eq(deals.id, id))
      .limit(1)
      .all();

    return result.length > 0 ? result[0] : null;
  }
}