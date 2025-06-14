import { CompanyRepository } from '@/server/repositories';
import { parseCompanyInput, CompanyInput } from '@/server/validation';
import { LeadSyncService } from './LeadSyncService';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

export class CompanyService {
  constructor(
    private readonly companyRepo = new CompanyRepository(),
    private readonly leadSyncService = new LeadSyncService()
  ) {}

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
   */
  validateCompanyInput(data: unknown): CompanyInput {
    return parseCompanyInput(data);
  }

  /**
   * Update company
   */
  async updateCompany(id: number, data: any): Promise<{ success: boolean; company?: any; error?: string }> {
    try {
      const updatedData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await this.companyRepo.update(id, updatedData);
      
      if (!result) {
        return { success: false, error: 'Company not found' };
      }

      return { success: true, company: result };
    } catch (error) {
      console.error('Error in CompanyService.updateCompany:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete company
   */
  async deleteCompany(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.companyRepo.delete(id);
      
      if (result.changes === 0) {
        return { success: false, error: 'Company not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in CompanyService.deleteCompany:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create company with optional contact assignment and bi-directional sync
   * Handles the complex transaction logic for company creation + contact assignment
   */
  async createWithContactAssignment(data: CompanyInput): Promise<{ success: boolean; company?: any; error?: string }> {
    try {
      const { assignContacts, ...companyData } = data;
      
      console.log('CompanyService.createWithContactAssignment:', { companyData, assignContacts });

      // Use transaction for atomic company creation + contact assignment
      const result = await db.transaction(async (tx) => {
        // Create company first
        const newCompany = {
          ...companyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const [company] = await tx
          .insert(companies)
          .values(newCompany)
          .returning({ 
            id: companies.id,
            name: companies.name,
            email: companies.email,
            phone: companies.phone,
            website: companies.website
          });
        
        console.log('Company created in transaction:', company);
        
        // If contacts are provided, assign them to the company with bi-directional sync
        if (assignContacts && assignContacts.length > 0) {
          console.log(`Assigning ${assignContacts.length} contacts to company ${company.id}`);
          
          // Validate that all contacts exist
          const contactsToUpdate = await tx
            .select()
            .from(contacts)
            .where(or(...assignContacts.map(id => eq(contacts.id, id))));
          
          console.log('Contacts found for assignment:', contactsToUpdate.length);
          
          if (contactsToUpdate.length !== assignContacts.length) {
            throw new Error(`Some contacts not found. Expected ${assignContacts.length}, found ${contactsToUpdate.length}`);
          }

          // Use LeadSyncService for each contact association with lead inheritance
          for (const contactId of assignContacts) {
            const associationResult = await this.leadSyncService.associateContactWithCompany(
              contactId, 
              company.id, 
              tx
            );
            
            if (!associationResult.success) {
              throw new Error(`Failed to associate contact ${contactId}: ${associationResult.error}`);
            }
          }
          
          console.log('Contact assignments and lead field inheritance completed via LeadSyncService');
        }
        
        return company;
      });
      
      console.log('Company creation transaction completed successfully');
      return { success: true, company: result };
      
    } catch (error) {
      console.error('Error in CompanyService.createWithContactAssignment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}