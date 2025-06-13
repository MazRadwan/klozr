import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq, like, or } from 'drizzle-orm';

export class ContactRepository {
  constructor(private readonly database = db) {}

  /**
   * Find all contacts with optional company information
   */
  findAll(includeCompany = false) {
    const baseQuery = includeCompany 
      ? this.database
          .select({
            id: contacts.id,
            first_name: contacts.first_name,
            last_name: contacts.last_name,
            email: contacts.email,
            phone: contacts.phone,
            contact_type: contacts.contact_type,
            type: contacts.type,
            company_id: contacts.company_id,
            owner_user_id: contacts.owner_user_id,
            address: contacts.address,
            city: contacts.city,
            state_province: contacts.state_province,
            postal_code: contacts.postal_code,
            is_primary: contacts.is_primary,
            // Lead management fields
            lead_status: contacts.lead_status,
            lead_temperature: contacts.lead_temperature,
            individual_lead_status: contacts.individual_lead_status,
            is_lead_contact: contacts.is_lead_contact,
            lead_source: contacts.lead_source,
            lead_assigned_date: contacts.lead_assigned_date,
            lead_owner_id: contacts.lead_owner_id,
            created_at: contacts.created_at,
            updated_at: contacts.updated_at,
            // Company information
            company: {
              id: companies.id,
              name: companies.name,
              lead_status: companies.lead_status,
              type: companies.type,
              lead_source: companies.lead_source,
              lead_temperature: companies.lead_temperature,
              lead_owner_id: companies.lead_owner_id,
            }
          })
          .from(contacts)
          .leftJoin(companies, eq(contacts.company_id, companies.id))
      : this.database.select().from(contacts);

    return baseQuery.all();
  }

  /**
   * Find contacts by company ID
   */
  findByCompany(companyId: number, includeCompany = false) {
    const baseQuery = includeCompany 
      ? this.database
          .select({
            id: contacts.id,
            first_name: contacts.first_name,
            last_name: contacts.last_name,
            email: contacts.email,
            phone: contacts.phone,
            contact_type: contacts.contact_type,
            type: contacts.type,
            company_id: contacts.company_id,
            owner_user_id: contacts.owner_user_id,
            address: contacts.address,
            city: contacts.city,
            state_province: contacts.state_province,
            postal_code: contacts.postal_code,
            is_primary: contacts.is_primary,
            // Lead management fields
            lead_status: contacts.lead_status,
            lead_temperature: contacts.lead_temperature,
            individual_lead_status: contacts.individual_lead_status,
            is_lead_contact: contacts.is_lead_contact,
            lead_source: contacts.lead_source,
            lead_assigned_date: contacts.lead_assigned_date,
            lead_owner_id: contacts.lead_owner_id,
            created_at: contacts.created_at,
            updated_at: contacts.updated_at,
            // Company information
            company: {
              id: companies.id,
              name: companies.name,
              lead_status: companies.lead_status,
              type: companies.type,
              lead_source: companies.lead_source,
              lead_temperature: companies.lead_temperature,
              lead_owner_id: companies.lead_owner_id,
            }
          })
          .from(contacts)
          .leftJoin(companies, eq(contacts.company_id, companies.id))
      : this.database.select().from(contacts);

    return baseQuery
      .where(eq(contacts.company_id, companyId))
      .all();
  }

  /**
   * Search contacts by name or email
   */
  search(searchTerm: string, includeCompany = false, limit = 20) {
    const searchPattern = `%${searchTerm}%`;
    
    const baseQuery = includeCompany 
      ? this.database
          .select({
            id: contacts.id,
            first_name: contacts.first_name,
            last_name: contacts.last_name,
            email: contacts.email,
            phone: contacts.phone,
            contact_type: contacts.contact_type,
            type: contacts.type,
            company_id: contacts.company_id,
            owner_user_id: contacts.owner_user_id,
            address: contacts.address,
            city: contacts.city,
            state_province: contacts.state_province,
            postal_code: contacts.postal_code,
            is_primary: contacts.is_primary,
            // Lead management fields
            lead_status: contacts.lead_status,
            lead_temperature: contacts.lead_temperature,
            individual_lead_status: contacts.individual_lead_status,
            is_lead_contact: contacts.is_lead_contact,
            lead_source: contacts.lead_source,
            lead_assigned_date: contacts.lead_assigned_date,
            lead_owner_id: contacts.lead_owner_id,
            created_at: contacts.created_at,
            updated_at: contacts.updated_at,
            // Company information
            company: {
              id: companies.id,
              name: companies.name,
              lead_status: companies.lead_status,
              type: companies.type,
              lead_source: companies.lead_source,
              lead_temperature: companies.lead_temperature,
              lead_owner_id: companies.lead_owner_id,
            }
          })
          .from(contacts)
          .leftJoin(companies, eq(contacts.company_id, companies.id))
      : this.database.select().from(contacts);

    return baseQuery
      .where(
        or(
          like(contacts.first_name, searchPattern),
          like(contacts.last_name, searchPattern),
          like(contacts.email, searchPattern)
        )
      )
      .limit(limit)
      .all();
  }

  /**
   * Find contact by ID
   */
  findById(id: number, includeCompany = false) {
    const baseQuery = includeCompany 
      ? this.database
          .select({
            id: contacts.id,
            first_name: contacts.first_name,
            last_name: contacts.last_name,
            email: contacts.email,
            phone: contacts.phone,
            contact_type: contacts.contact_type,
            type: contacts.type,
            company_id: contacts.company_id,
            owner_user_id: contacts.owner_user_id,
            address: contacts.address,
            city: contacts.city,
            state_province: contacts.state_province,
            postal_code: contacts.postal_code,
            is_primary: contacts.is_primary,
            // Lead management fields
            lead_status: contacts.lead_status,
            lead_temperature: contacts.lead_temperature,
            individual_lead_status: contacts.individual_lead_status,
            is_lead_contact: contacts.is_lead_contact,
            lead_source: contacts.lead_source,
            lead_assigned_date: contacts.lead_assigned_date,
            lead_owner_id: contacts.lead_owner_id,
            created_at: contacts.created_at,
            updated_at: contacts.updated_at,
            // Company information
            company: {
              id: companies.id,
              name: companies.name,
              lead_status: companies.lead_status,
              type: companies.type,
              lead_source: companies.lead_source,
              lead_temperature: companies.lead_temperature,
              lead_owner_id: companies.lead_owner_id,
            }
          })
          .from(contacts)
          .leftJoin(companies, eq(contacts.company_id, companies.id))
      : this.database.select().from(contacts);

    const result = baseQuery
      .where(eq(contacts.id, id))
      .limit(1)
      .all();

    return result.length > 0 ? result[0] : null;
  }
}