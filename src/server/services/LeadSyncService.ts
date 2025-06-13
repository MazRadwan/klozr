import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';
import { EntityType, EntityTypeUtilityService } from './EntityTypeUtilityService';
import { LeadStatus, LeadTemperature, LeadSource } from './LeadUtilityService';

/**
 * Service for handling bi-directional synchronization between companies and contacts
 * CRITICAL: This service handles complex data consistency logic - test thoroughly!
 */
export class LeadSyncService {
  constructor(private readonly database = db) {}

  /**
   * Updates company type and syncs to all related contacts
   * Based on /api/companies/[id]/type/route.ts logic
   */
  async updateCompanyType(
    companyId: number, 
    newType: EntityType | null,
    transaction?: any
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = transaction || this.database;

    try {
      // Get current company data
      const company = dbInstance
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1)
        .all()[0];

      if (!company) {
        return { success: false, error: 'Company not found' };
      }

      // Determine if lead fields should be cleared
      const shouldClearLeadFields = EntityTypeUtilityService.shouldClearLeadFields(
        company.type, 
        newType
      );

      // Prepare company update data
      const companyUpdateData: any = {
        type: newType,
        updated_at: new Date().toISOString()
      };

      // Clear lead fields if transitioning away from 'lead'
      if (shouldClearLeadFields) {
        companyUpdateData.lead_status = null;
        companyUpdateData.lead_temperature = null;
        companyUpdateData.lead_source = null;
        companyUpdateData.lead_assigned_date = null;
        companyUpdateData.lead_owner_id = null;
      }

      // Prepare contacts update data (inherit company type)
      const contactsUpdateData: any = {
        type: newType,
        updated_at: new Date().toISOString()
      };

      // Clear contact lead fields if needed
      if (shouldClearLeadFields) {
        contactsUpdateData.lead_status = null;
        contactsUpdateData.lead_temperature = null;
        contactsUpdateData.lead_source = null;
        contactsUpdateData.lead_assigned_date = null;
        contactsUpdateData.lead_owner_id = null;
      }

      // ATOMIC OPERATION: Update company and all related contacts
      await Promise.all([
        dbInstance.update(companies)
          .set(companyUpdateData)
          .where(eq(companies.id, companyId)),
        dbInstance.update(contacts)
          .set(contactsUpdateData)
          .where(eq(contacts.company_id, companyId))
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error in updateCompanyType:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Updates contact type and syncs to company and sibling contacts
   * Based on /api/contacts/[id]/type/route.ts logic
   */
  async updateContactType(
    contactId: number,
    newType: EntityType | null,
    transaction?: any
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = transaction || this.database;

    try {
      // Get current contact data
      const contact = dbInstance
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1)
        .all()[0];

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      // Determine if lead fields should be cleared
      const shouldClearLeadFields = EntityTypeUtilityService.shouldClearLeadFields(
        contact.type,
        newType
      );

      // Prepare contact update data
      const contactUpdateData: any = {
        type: newType,
        updated_at: new Date().toISOString()
      };

      // Clear contact lead fields if needed
      if (shouldClearLeadFields) {
        contactUpdateData.lead_status = null;
        contactUpdateData.lead_temperature = null;
        contactUpdateData.lead_source = null;
        contactUpdateData.lead_assigned_date = null;
        contactUpdateData.lead_owner_id = null;
      }

      const updates = [];

      // Update the contact
      updates.push(
        dbInstance.update(contacts)
          .set(contactUpdateData)
          .where(eq(contacts.id, contactId))
      );

      // If contact has a company, update company and sibling contacts
      if (contact.company_id) {
        // Prepare company update data
        const companyUpdateData: any = {
          type: newType,
          updated_at: new Date().toISOString()
        };

        // Clear company lead fields if needed
        if (shouldClearLeadFields) {
          companyUpdateData.lead_status = null;
          companyUpdateData.lead_temperature = null;
          companyUpdateData.lead_source = null;
          companyUpdateData.lead_assigned_date = null;
          companyUpdateData.lead_owner_id = null;
        }

        // Prepare sibling contacts update data
        const otherContactsUpdateData: any = {
          type: newType,
          updated_at: new Date().toISOString()
        };

        // Clear sibling contact lead fields if needed
        if (shouldClearLeadFields) {
          otherContactsUpdateData.lead_status = null;
          otherContactsUpdateData.lead_temperature = null;
          otherContactsUpdateData.lead_source = null;
          otherContactsUpdateData.lead_assigned_date = null;
          otherContactsUpdateData.lead_owner_id = null;
        }

        // Update company
        updates.push(
          dbInstance.update(companies)
            .set(companyUpdateData)
            .where(eq(companies.id, contact.company_id))
        );

        // Update other contacts in the same company
        updates.push(
          dbInstance.update(contacts)
            .set(otherContactsUpdateData)
            .where(and(
              eq(contacts.company_id, contact.company_id),
              ne(contacts.id, contactId)
            ))
        );
      }

      // ATOMIC OPERATION: Execute all updates
      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      console.error('Error in updateContactType:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Updates company lead data and syncs to all related contacts
   * Based on /api/companies/[id]/lead/route.ts logic
   */
  async updateCompanyLeadData(
    companyId: number,
    leadData: {
      status?: LeadStatus | null;
      temperature?: LeadTemperature | null;
      source?: LeadSource | null;
      ownerId?: number | null;
    },
    transaction?: any
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = transaction || this.database;

    try {
      // Prepare lead update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (leadData.status !== undefined) {
        updateData.lead_status = leadData.status;
        // Auto-assign date when status is set
        if (leadData.status) {
          updateData.lead_assigned_date = new Date().toISOString();
        }
      }
      if (leadData.temperature !== undefined) {
        updateData.lead_temperature = leadData.temperature;
      }
      if (leadData.source !== undefined) {
        updateData.lead_source = leadData.source;
      }
      if (leadData.ownerId !== undefined) {
        updateData.lead_owner_id = leadData.ownerId;
      }

      // ATOMIC OPERATION: Update company and all related contacts
      await Promise.all([
        dbInstance.update(companies)
          .set(updateData)
          .where(eq(companies.id, companyId)),
        dbInstance.update(contacts)
          .set(updateData)
          .where(eq(contacts.company_id, companyId))
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error in updateCompanyLeadData:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Updates contact lead data and syncs to company and sibling contacts
   * Based on /api/contacts/[id]/lead/route.ts logic
   */
  async updateContactLeadData(
    contactId: number,
    leadData: {
      status?: LeadStatus | null;
      temperature?: LeadTemperature | null;
      source?: LeadSource | null;
      ownerId?: number | null;
    },
    transaction?: any
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = transaction || this.database;

    try {
      // Get current contact data
      const contact = dbInstance
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1)
        .all()[0];

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      // Prepare lead update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (leadData.status !== undefined) {
        updateData.lead_status = leadData.status;
        // Also update individual_lead_status for backward compatibility
        updateData.individual_lead_status = leadData.status;
        // Auto-assign date when status is set
        if (leadData.status) {
          updateData.lead_assigned_date = new Date().toISOString();
        }
      }
      if (leadData.temperature !== undefined) {
        updateData.lead_temperature = leadData.temperature;
      }
      if (leadData.source !== undefined) {
        updateData.lead_source = leadData.source;
      }
      if (leadData.ownerId !== undefined) {
        updateData.lead_owner_id = leadData.ownerId;
      }

      const updates = [];

      // Update the contact
      updates.push(
        dbInstance.update(contacts)
          .set(updateData)
          .where(eq(contacts.id, contactId))
      );

      // If contact has a company, update company and sibling contacts
      if (contact.company_id) {
        // Update company
        updates.push(
          dbInstance.update(companies)
            .set(updateData)
            .where(eq(companies.id, contact.company_id))
        );

        // Update other contacts in the same company
        updates.push(
          dbInstance.update(contacts)
            .set(updateData)
            .where(and(
              eq(contacts.company_id, contact.company_id),
              ne(contacts.id, contactId)
            ))
        );
      }

      // ATOMIC OPERATION: Execute all updates
      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      console.error('Error in updateContactLeadData:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Handles contact association with lead data inheritance
   * Based on /api/contacts/[id]/route.ts association logic
   */
  async associateContactWithCompany(
    contactId: number,
    companyId: number | null,
    transaction?: any
  ): Promise<{ success: boolean; error?: string }> {
    const dbInstance = transaction || this.database;

    try {
      if (!companyId) {
        // Simply unlink contact from company
        await dbInstance.update(contacts)
          .set({ 
            company_id: null,
            updated_at: new Date().toISOString()
          })
          .where(eq(contacts.id, contactId));
        
        return { success: true };
      }

      // Get company data for inheritance
      const company = dbInstance
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1)
        .all()[0];

      if (!company) {
        return { success: false, error: 'Company not found' };
      }

      // Get current contact data
      const contact = dbInstance
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1)
        .all()[0];

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      // Prepare contact update with company association
      const contactUpdateData: any = {
        company_id: companyId,
        updated_at: new Date().toISOString()
      };

      // Inherit lead data from company if both are leads
      if (company.type === 'lead' && contact.type === 'lead') {
        if (company.lead_status) contactUpdateData.lead_status = company.lead_status;
        if (company.lead_temperature) contactUpdateData.lead_temperature = company.lead_temperature;
        if (company.lead_source) contactUpdateData.lead_source = company.lead_source;
        if (company.lead_owner_id) contactUpdateData.lead_owner_id = company.lead_owner_id;
        if (company.lead_assigned_date) contactUpdateData.lead_assigned_date = company.lead_assigned_date;
      }

      // Update contact
      await dbInstance.update(contacts)
        .set(contactUpdateData)
        .where(eq(contacts.id, contactId));

      return { success: true };
    } catch (error) {
      console.error('Error in associateContactWithCompany:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}