import { DealRepository } from '@/server/repositories';
import { parseDealInput, DealInput } from '@/server/validation';

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
   * Delete a deal (safe - no bi-directional sync)
   */
  async deleteDeal(id: number) {
    return this.dealRepo.delete(id);
  }
}