import { ContactRepository } from '@/server/repositories';
import { parseContactInput, ContactInput } from '@/server/validation';

export class ContactService {
  constructor(private readonly contactRepo = new ContactRepository()) {}

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
   * NOTE: Creation/updates with bi-directional sync will be handled separately
   */
  validateContactInput(data: unknown): ContactInput {
    return parseContactInput(data);
  }
}