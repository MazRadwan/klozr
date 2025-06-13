import { ContactRepository } from '@/server/repositories';
import { parseContactInput, ContactInput } from '@/server/validation';
import { LeadSyncService } from './LeadSyncService';
import { db } from '@/lib/db';
import { contacts, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export class ContactService {
  constructor(
    private readonly contactRepo = new ContactRepository(),
    private readonly leadSyncService = new LeadSyncService()
  ) {}

  /**
   * Get all contacts with optional filtering
   */
  async getContacts(options: {
    companyId?: number;
    searchQuery?: string;
    includeCompany?: boolean;
    limit?: number;
  } = {}) {
    const { companyId, searchQuery, includeCompany = false, limit = 20 } = options;

    if (searchQuery) {
      return this.contactRepo.search(searchQuery, includeCompany, limit);
    }

    if (companyId) {
      return this.contactRepo.findByCompany(companyId, includeCompany);
    }

    return this.contactRepo.findAll(includeCompany);
  }

  /**
   * Get contact by ID
   */
  async getContactById(id: number, includeCompany = false) {
    return this.contactRepo.findById(id, includeCompany);
  }

  /**
   * Validate contact input data
   */
  validateContactInput(data: unknown): ContactInput {
    return parseContactInput(data);
  }

  /**
   * Create contact with optional company association and bi-directional sync
   * Handles lead field inheritance when contact is associated with a company
   */
  async createWithCompanyAssociation(data: ContactInput): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      console.log('ContactService.createWithCompanyAssociation:', data);

      // Start with the provided contact data
      let contactData = { 
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      };

      // If company_id is provided, handle lead field inheritance
      if (data.company_id) {
        console.log('Contact has company_id, checking for lead inheritance:', data.company_id);
        
        // Fetch company data to check for lead field inheritance
        const company = await db
          .select()
          .from(companies)
          .where(eq(companies.id, data.company_id))
          .limit(1)
          .all();
        
        if (company.length === 0) {
          return { 
            success: false, 
            error: `Company with ID ${data.company_id} not found` 
          };
        }

        // If company is a lead, inherit lead fields for bi-directional sync
        if (company[0].type === 'lead') {
          console.log('Company is a lead, inheriting lead fields:', {
            companyType: company[0].type,
            leadStatus: company[0].lead_status,
            leadTemperature: company[0].lead_temperature,
            leadSource: company[0].lead_source
          });
          
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

      // Create the contact
      const inserted = await db.insert(contacts).values(contactData).run();
      console.log('Contact created successfully with inherited lead data:', inserted);
      
      // Return the complete contact data including the new ID
      const newContact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, inserted.lastInsertRowid as number))
        .limit(1)
        .all()[0];
      
      if (!newContact) {
        return { 
          success: false, 
          error: 'Failed to retrieve created contact' 
        };
      }

      console.log('Contact creation completed successfully via service');
      return { success: true, contact: newContact };
      
    } catch (error) {
      console.error('Error in ContactService.createWithCompanyAssociation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}