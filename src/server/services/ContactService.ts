import { ContactRepository } from '@/server/repositories';
import { parseContactInput, ContactInput } from '@/server/validation';
import { LeadSyncService } from './LeadSyncService';
import { db } from '@/lib/db';
import { contacts, companies, deals } from '@/lib/schema';
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
   * Get contact with related data (company and deals)
   * This consolidates the complex query logic from the route
   */
  async getContactWithRelatedData(id: number) {
    // Use repository method first to get contact with company
    const contact = await this.contactRepo.findById(id, true);
    
    if (!contact) {
      return null;
    }

    // Get related deals using a separate query
    const relatedDeals = await db
      .select({
        deal: {
          id: deals.id,
          title: deals.title,
          amount: deals.amount,
          stage: deals.stage,
          close_date: deals.close_date,
          created_at: deals.created_at,
          updated_at: deals.updated_at,
          deal_notes: deals.deal_notes,
        },
        company: {
          id: companies.id,
          name: companies.name,
        },
      })
      .from(deals)
      .leftJoin(companies, eq(deals.company_id, companies.id))
      .where(eq(deals.contact_id, id))
      .all();

    return {
      ...contact,
      deals: relatedDeals
    };
  }

  /**
   * Update contact
   */
  async updateContact(id: number, data: any): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      const updatedData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await this.contactRepo.update(id, updatedData);
      
      if (!result) {
        return { success: false, error: 'Contact not found' };
      }

      return { success: true, contact: result };
    } catch (error) {
      console.error('Error in ContactService.updateContact:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.contactRepo.delete(id);
      
      if (result.changes === 0) {
        return { success: false, error: 'Contact not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in ContactService.deleteContact:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update contact company association using LeadSyncService
   * This abstracts the complex bi-directional sync logic from the route
   */
  async updateContactCompanyAssociation(contactId: number, companyId: number | null): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      if (companyId === null) {
        // Disassociate contact from company
        const result = await this.updateContact(contactId, { company_id: null });
        return result;
      }

      // Use LeadSyncService for complex association with bi-directional sync
      const associationResult = await this.leadSyncService.associateContactWithCompany(contactId, companyId);
      
      if (!associationResult.success) {
        return { success: false, error: associationResult.error };
      }

      // Return updated contact
      const updatedContact = await this.getContactById(contactId, true);
      return { success: true, contact: updatedContact };
      
    } catch (error) {
      console.error('Error in ContactService.updateContactCompanyAssociation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
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