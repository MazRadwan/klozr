import { CompanyRepository } from '@/server/repositories';
import { parseCompanyInput, CompanyInput } from '@/server/validation';

export class CompanyService {
  constructor(private readonly companyRepo = new CompanyRepository()) {}

  /**
   * Get all companies with optional search
   */
  async getCompanies(searchQuery?: string) {
    if (searchQuery) {
      return this.companyRepo.search(searchQuery);
    }

    return this.companyRepo.findAll();
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: number) {
    return this.companyRepo.findById(id);
  }

  /**
   * Validate company input data
   * NOTE: Creation/updates with bi-directional sync will be handled separately
   */
  validateCompanyInput(data: unknown): CompanyInput {
    return parseCompanyInput(data);
  }
}