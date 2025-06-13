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
   * NOTE: Creation/updates will be handled separately
   */
  validateDealInput(data: unknown): DealInput {
    return parseDealInput(data);
  }
}