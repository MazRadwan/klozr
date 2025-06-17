import { DealRepository } from '@/server/repositories';
import { parseDealInput, DealInput } from '@/server/validation';
import { contacts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export class DealService {
  constructor(private readonly dealRepo = new DealRepository()) {}

  /**
   * Get all deals with optional filtering
   */
  async getDeals(options: {
    companyId?: number;
    searchQuery?: string;
  } = {}) {
    const { companyId, searchQuery } = options;

    if (companyId) {
      return this.dealRepo.findByCompany(companyId);
    }

    if (searchQuery) {
      return this.dealRepo.search(searchQuery);
    }

    return this.dealRepo.findAll();
  }

  /**
   * Get deal by ID
   */
  async getDealById(id: number) {
    return this.dealRepo.findById(id);
  }

  /**
   * Validate deal input data
   */
  validateDealInput(data: unknown): DealInput {
    return parseDealInput(data);
  }

  /**
   * Create a new deal (safe - no bi-directional sync)
   */
  async createDeal(dealData: DealInput) {
    // Validate input
    const validatedData = this.validateDealInput(dealData);
    
    // Create deal
    const newDeal = this.dealRepo.create(validatedData);
    
    // Return with related data
    return this.dealRepo.findById(newDeal.id);
  }

  /**
   * Update a deal (safe - no bi-directional sync)
   */
  async updateDeal(id: number, dealData: Partial<DealInput>) {
    // Update deal
    const updatedDeal = this.dealRepo.update(id, dealData);
    
    // Return with related data
    return this.dealRepo.findById(updatedDeal.id);
  }

  /**
   * Update deal with smart company/contact auto-sync logic
   * Handles the complex business rules for keeping contact/company relationships in sync
   */
  async updateDealWithAutoSync(id: number, updateData: any): Promise<{ success: boolean; deal?: any; error?: string }> {
    try {
      // Get existing deal first
      const existingDeal = await this.dealRepo.findById(id);
      if (!existingDeal) {
        return { success: false, error: 'Deal not found' };
      }

      const { 
        contact_id, 
        company_id, 
        ...otherFields 
      } = updateData;

      // Prepare final update data
      const finalUpdateData: any = { ...otherFields };

      // Auto-sync logic: If contact is being linked/changed, update company to match contact's company
      if (contact_id !== undefined && contact_id !== null) {
        // @ts-ignore - internal access needed for one-off validation query
        const [contactWithCompany] = await this.dealRepo.database
          .select({ company_id: contacts.company_id })
          .from(contacts)
          .where(eq(contacts.id, contact_id))
          .limit(1);
        
        if (contactWithCompany && contactWithCompany.company_id) {
          finalUpdateData.company_id = contactWithCompany.company_id;
        }
        finalUpdateData.contact_id = contact_id;
      }

      // If company is being changed manually we always carry over that change.
      // When a deal already has a contact *and* the caller is NOT simultaneously supplying
      // a new contact, make sure that existing contact still belongs to the new company.
      if (company_id !== undefined) {
        // Handle mismatch-detection only when:
        //   1) the deal currently has a contact, AND
        //   2) the update payload is not replacing that contact (contact_id is undefined)
        if (existingDeal.deal.contact_id && contact_id === undefined) {
          // @ts-ignore - internal access needed for one-off validation query
          const [currentContactCompany] = await this.dealRepo.database
            .select({ company_id: contacts.company_id })
            .from(contacts)
            .where(eq(contacts.id, existingDeal.deal.contact_id))
            .limit(1);

          // If the current contact belongs to a different company, unlink it
          if (currentContactCompany && currentContactCompany.company_id !== company_id) {
            finalUpdateData.contact_id = null;
          }
        }

        // Always apply the explicit company change (including null to unlink)
        finalUpdateData.company_id = company_id;
      }

      // Add updated timestamp
      finalUpdateData.updated_at = new Date().toISOString();

      // Update the deal
      const result = this.dealRepo.update(id, finalUpdateData);
      
      if (!result) {
        return { success: false, error: 'Failed to update deal' };
      }

      // Return updated deal with relations
      const updatedDeal = await this.dealRepo.findById(id);
      return { success: true, deal: updatedDeal };

    } catch (error) {
      console.error('Error in DealService.updateDealWithAutoSync:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete a deal (safe - no bi-directional sync)
   */
  async deleteDeal(id: number) {
    return this.dealRepo.delete(id);
  }
}