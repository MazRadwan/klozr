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
   * This preserves the EXACT API contract from the original route
   */
  async getContactWithRelatedData(id: number) {
    // CRITICAL: Match exact query structure from original route
    const contactResult = await db
      .select({
        contact: {
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
          individual_lead_status: contacts.individual_lead_status,
          lead_temperature: contacts.lead_temperature,
          lead_source: contacts.lead_source,
          lead_owner_id: contacts.lead_owner_id,
          lead_assigned_date: contacts.lead_assigned_date,
          created_at: contacts.created_at,
          updated_at: contacts.updated_at,
        },
        company: {
          id: companies.id,
          name: companies.name,
          type: companies.type,
          website: companies.website,
          address: companies.address,
          city: companies.city,
          state: companies.state,
          country: companies.country,
          phone: companies.phone,
          industry: companies.industry,
          lead_status: companies.lead_status,
          lead_source: companies.lead_source,
          lead_temperature: companies.lead_temperature,
          lead_owner_id: companies.lead_owner_id,
        }
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, id))
      .limit(1);

    if (contactResult.length === 0) {
      return null;
    }

    // Get related deals with exact same structure
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
      .where(eq(deals.contact_id, id));

    // Return exact same format as original route
    return {
      contact: contactResult[0].contact,
      company: contactResult[0].company,
      relatedDeals
    };
  }

  /**
   * Update contact with primary contact business logic
   */
  async updateContact(id: number, data: any): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      // Handle primary contact logic if is_primary is being updated
      if ('is_primary' in data && data.is_primary === true) {
        const primaryContactResult = await this.handlePrimaryContactAssignment(id, data);
        if (!primaryContactResult.success) {
          return primaryContactResult;
        }
        // If successful, the primary contact logic has already updated the contact
        return { success: true, contact: primaryContactResult.contact };
      }

      // Standard update for non-primary contact changes
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
   * Handle primary contact assignment with business logic
   * Ensures only one primary contact per company
   */
  private async handlePrimaryContactAssignment(contactId: number, data: any): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      // Get the contact to check if it has a company
      const contact = await this.contactRepo.findById(contactId);
      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      // Only apply primary contact logic if contact has a company
      if (!contact.company_id) {
        // If no company, just update normally (is_primary will be false effectively)
        const updatedData = {
          ...data,
          is_primary: false, // Force to false if no company
          updated_at: new Date().toISOString(),
        };
        const result = await this.contactRepo.update(contactId, updatedData);
        return { success: true, contact: result };
      }

      // Find existing primary contact for this company
      const existingPrimary = await this.contactRepo.findPrimaryByCompany(contact.company_id);
      
      // Begin transaction-like operation
      const results = [];
      
      // If there's an existing primary contact, unset it first
      if (existingPrimary && existingPrimary.id !== contactId) {
        const unsetResult = await this.contactRepo.update(existingPrimary.id, {
          is_primary: false,
          updated_at: new Date().toISOString(),
        });
        results.push(unsetResult);
      }

      // Set the new primary contact
      const updatedData = {
        ...data,
        is_primary: true,
        updated_at: new Date().toISOString(),
      };
      
      const newPrimaryResult = await this.contactRepo.update(contactId, updatedData);
      if (!newPrimaryResult) {
        return { success: false, error: 'Failed to set primary contact' };
      }

      return { 
        success: true, 
        contact: newPrimaryResult,
        previousPrimary: existingPrimary 
      };
    } catch (error) {
      console.error('Error in handlePrimaryContactAssignment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete contact with primary contact cleanup
   */
  async deleteContact(id: number): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Check if this contact was primary before deleting
      const contactToDelete = await this.contactRepo.findById(id);
      if (!contactToDelete) {
        return { success: false, error: 'Contact not found' };
      }

      const wasPrimary = contactToDelete.is_primary;
      const companyId = contactToDelete.company_id;

      const result = await this.contactRepo.delete(id);
      
      if (result.changes === 0) {
        return { success: false, error: 'Contact not found' };
      }

      // If the deleted contact was primary and had a company, 
      // automatically assign primary status to the first remaining contact
      if (wasPrimary && companyId) {
        await this.autoAssignPrimaryContact(companyId);
      }

      return { success: true, result };
    } catch (error) {
      console.error('Error in ContactService.deleteContact:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Automatically assign primary contact to first available contact in company
   */
  private async autoAssignPrimaryContact(companyId: number): Promise<void> {
    try {
      const remainingContacts = await this.contactRepo.findByCompany(companyId);
      if (remainingContacts.length > 0) {
        // Assign primary to the first contact (oldest by ID)
        const firstContact = remainingContacts[0];
        await this.contactRepo.update(firstContact.id, {
          is_primary: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error in autoAssignPrimaryContact:', error);
      // Don't throw - this is cleanup logic, failure shouldn't break delete
    }
  }

  /**
   * Update contact company association - EXACT replica of original route logic
   * CRITICAL: This preserves the exact bi-directional sync behavior from PATCH route
   */
  async updateContactCompanyAssociation(contactId: number, companyId: number | null): Promise<{ success: boolean; updated?: any; error?: string }> {
    try {
      console.log(`[PATCH] Contact ${contactId} company association: ${companyId}`);
      
      // Get current contact data to determine what sync operations are needed
      const currentContact = db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .get();
      
      if (!currentContact) {
        return { success: false, error: 'Contact not found' };
      }
      
      const oldCompanyId = currentContact.company_id;
      const newCompanyId = companyId === null ? null : parseInt(companyId.toString());
      
      // Update the contact's company association
      const updated = db
        .update(contacts)
        .set({ 
          company_id: newCompanyId,
          updated_at: new Date().toISOString()
        })
        .where(eq(contacts.id, contactId))
        .run();
      
      console.log(`[PATCH] Contact updated: ${JSON.stringify(updated)}`);
      
      // Perform bi-directional sync operations - EXACT original logic
      const syncOperations = [];
      
      // Case 1: Linking contact to a company (newCompanyId is not null)
      if (newCompanyId && oldCompanyId !== newCompanyId) {
        console.log(`[PATCH] Linking contact ${contactId} to company ${newCompanyId}`);
        
        // Get the company data
        const company = db
          .select()
          .from(companies)
          .where(eq(companies.id, newCompanyId))
          .get();
        
        if (company) {
          // Sync lead data if contact has lead information and it's a lead type
          if (currentContact.type === 'lead' && 
              (currentContact.lead_status || currentContact.lead_temperature || currentContact.lead_source)) {
            
            console.log(`[PATCH] Syncing contact lead data to company ${newCompanyId}`);
            
            const companyUpdateData: any = {
              updated_at: new Date().toISOString()
            };
            
            // Sync lead fields from contact to company
            if (currentContact.lead_status) companyUpdateData.lead_status = currentContact.lead_status;
            if (currentContact.lead_temperature) companyUpdateData.lead_temperature = currentContact.lead_temperature;
            if (currentContact.lead_source) companyUpdateData.lead_source = currentContact.lead_source;
            if (currentContact.lead_owner_id) companyUpdateData.lead_owner_id = currentContact.lead_owner_id;
            if (currentContact.lead_assigned_date) companyUpdateData.lead_assigned_date = currentContact.lead_assigned_date;
            
            // Also sync entity type if contact is a lead
            if (currentContact.type) companyUpdateData.type = currentContact.type;
            
            syncOperations.push(
              db
                .update(companies)
                .set(companyUpdateData)
                .where(eq(companies.id, newCompanyId))
                .run()
            );
          }
          // If contact is not a lead but company is, inherit company lead data
          else if (company.type === 'lead' && currentContact.type !== 'lead') {
            console.log(`[PATCH] Contact inheriting lead data from company ${newCompanyId}`);
            
            const contactUpdateData: any = {
              updated_at: new Date().toISOString()
            };
            
            // Inherit lead fields from company
            if (company.lead_status) contactUpdateData.lead_status = company.lead_status;
            if (company.lead_temperature) contactUpdateData.lead_temperature = company.lead_temperature;
            if (company.lead_source) contactUpdateData.lead_source = company.lead_source;
            if (company.lead_owner_id) contactUpdateData.lead_owner_id = company.lead_owner_id;
            if (company.lead_assigned_date) contactUpdateData.lead_assigned_date = company.lead_assigned_date;
            
            // Also inherit entity type
            if (company.type) contactUpdateData.type = company.type;
            
            syncOperations.push(
              db
                .update(contacts)
                .set(contactUpdateData)
                .where(eq(contacts.id, contactId))
                .run()
            );
          }
        }
      }
      
      // Case 2: Unlinking contact from company (newCompanyId is null and oldCompanyId was not null)
      else if (newCompanyId === null && oldCompanyId !== null) {
        console.log(`[PATCH] Unlinking contact ${contactId} from company ${oldCompanyId}`);
        // When unlinking, preserve the contact's current lead data
        // No additional sync needed - contact keeps its individual status
      }
      
      // Execute all sync operations atomically - EXACT original logic
      if (syncOperations.length > 0) {
        console.log(`[PATCH] Executing ${syncOperations.length} sync operations`);
        Promise.all(syncOperations);
      }
      
      console.log(`[PATCH] Company association update completed for contact ${contactId}`);
      
      return { success: true, updated };
      
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