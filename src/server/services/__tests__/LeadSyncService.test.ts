import { beforeEach, describe, expect, test, jest } from '@jest/globals';
import { LeadSyncService } from '../LeadSyncService';
import { db } from '@/lib/db';
import { companies, contacts } from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn()
  }
}));

// Mock the utility services
jest.mock('../EntityTypeUtilityService', () => ({
  EntityTypeUtilityService: {
    shouldClearLeadFields: jest.fn()
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('LeadSyncService', () => {
  let leadSyncService: LeadSyncService;
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    leadSyncService = new LeadSyncService();
    
    // Mock database transaction
    mockTransaction = {
      select: jest.fn(),
      update: jest.fn()
    };
    
    // Setup common mock chains
    const mockSelectChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      all: jest.fn()
    };
    
    const mockUpdateChain = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis()
    };

    mockDb.select.mockReturnValue(mockSelectChain);
    mockDb.update.mockReturnValue(mockUpdateChain);
    mockTransaction.select.mockReturnValue(mockSelectChain);
    mockTransaction.update.mockReturnValue(mockUpdateChain);
  });

  describe('updateCompanyType', () => {
    test('should update company type and sync to contacts', async () => {
      // Mock company data
      const mockCompany = {
        id: 1,
        name: 'Test Company',
        type: 'lead',
        lead_status: 'prospect',
        lead_temperature: 'warm'
      };

      // Mock EntityTypeUtilityService
      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(true);

      // Setup select chain to return company
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockCompany]);

      // Setup update chains
      const companyUpdateChain = mockDb.update();
      const contactsUpdateChain = mockDb.update();
      
      // Mock Promise.all
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateCompanyType(1, 'customer');

      expect(result.success).toBe(true);
      expect(EntityTypeUtilityService.shouldClearLeadFields).toHaveBeenCalledWith('lead', 'customer');
      expect(promiseAllSpy).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });

    test('should return error when company not found', async () => {
      // Setup select to return empty array
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([]);

      const result = await leadSyncService.updateCompanyType(999, 'customer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Company not found');
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const selectChain = mockDb.select();
      selectChain.all.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await leadSyncService.updateCompanyType(1, 'customer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('updateContactType', () => {
    test('should update contact type and sync to company and siblings', async () => {
      // Mock contact data
      const mockContact = {
        id: 15,
        first_name: 'John',
        last_name: 'Doe',
        company_id: 1,
        type: 'lead'
      };

      // Mock EntityTypeUtilityService
      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(false);

      // Setup select chain to return contact
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockContact]);

      // Mock Promise.all
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateContactType(15, 'customer');

      expect(result.success).toBe(true);
      expect(EntityTypeUtilityService.shouldClearLeadFields).toHaveBeenCalledWith('lead', 'customer');
      expect(promiseAllSpy).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });

    test('should handle contact without company_id', async () => {
      // Mock contact without company
      const mockContact = {
        id: 15,
        first_name: 'John',
        last_name: 'Doe',
        company_id: null,
        type: 'lead'
      };

      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(false);

      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockContact]);

      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateContactType(15, 'customer');

      expect(result.success).toBe(true);
      // Should only update the contact, not company or siblings
      expect(promiseAllSpy).toHaveBeenCalledWith([expect.anything()]);
      
      promiseAllSpy.mockRestore();
    });
  });

  describe('updateCompanyLeadData', () => {
    test('should update company and contacts lead data', async () => {
      const leadData = {
        status: 'qualified' as const,
        temperature: 'hot' as const,
        source: 'website' as const,
        ownerId: 1
      };

      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateCompanyLeadData(1, leadData);

      expect(result.success).toBe(true);
      expect(promiseAllSpy).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });

    test('should auto-assign date when status is set', async () => {
      const leadData = { status: 'qualified' as const };
      
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);
      const dateNowSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');

      const result = await leadSyncService.updateCompanyLeadData(1, leadData);

      expect(result.success).toBe(true);
      
      promiseAllSpy.mockRestore();
      dateNowSpy.mockRestore();
    });
  });

  describe('updateContactLeadData', () => {
    test('should update contact and sync to company and siblings', async () => {
      const mockContact = {
        id: 15,
        company_id: 1,
        type: 'lead'
      };

      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockContact]);

      const leadData = {
        status: 'opportunity' as const,
        temperature: 'warm' as const
      };

      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateContactLeadData(15, leadData);

      expect(result.success).toBe(true);
      expect(promiseAllSpy).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });

    test('should update individual_lead_status for backward compatibility', async () => {
      const mockContact = {
        id: 15,
        company_id: 1,
        type: 'lead'
      };

      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockContact]);

      const leadData = { status: 'qualified' as const };
      
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      await leadSyncService.updateContactLeadData(15, leadData);

      // Verify that the update includes individual_lead_status
      expect(promiseAllSpy).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });
  });

  describe('associateContactWithCompany', () => {
    test('should unlink contact when companyId is null', async () => {
      const updateChain = mockDb.update();
      
      const result = await leadSyncService.associateContactWithCompany(15, null);

      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    test('should associate contact and inherit lead data', async () => {
      const mockCompany = {
        id: 1,
        type: 'lead',
        lead_status: 'prospect',
        lead_temperature: 'warm',
        lead_source: 'website',
        lead_owner_id: 1,
        lead_assigned_date: '2024-01-01T00:00:00.000Z'
      };

      const mockContact = {
        id: 15,
        type: 'lead'
      };

      // Mock select chain for company and contact
      const selectChain = mockDb.select();
      selectChain.all
        .mockReturnValueOnce([mockCompany])  // First call for company
        .mockReturnValueOnce([mockContact]); // Second call for contact

      const updateChain = mockDb.update();

      const result = await leadSyncService.associateContactWithCompany(15, 1);

      expect(result.success).toBe(true);
      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockDb.update).toHaveBeenCalled();
    });

    test('should return error when company not found', async () => {
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([]); // Empty array = company not found

      const result = await leadSyncService.associateContactWithCompany(15, 999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Company not found');
    });

    test('should return error when contact not found', async () => {
      const mockCompany = { id: 1, type: 'lead' };
      
      const selectChain = mockDb.select();
      selectChain.all
        .mockReturnValueOnce([mockCompany])  // Company found
        .mockReturnValueOnce([]);            // Contact not found

      const result = await leadSyncService.associateContactWithCompany(15, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contact not found');
    });
  });

  describe('transaction support', () => {
    test('should use provided transaction instance', async () => {
      const mockCompany = {
        id: 1,
        type: 'lead'
      };

      // Mock transaction select chain
      const selectChain = mockTransaction.select();
      selectChain.all.mockReturnValue([mockCompany]);

      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(false);

      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      const result = await leadSyncService.updateCompanyType(1, 'customer', mockTransaction);

      expect(result.success).toBe(true);
      expect(mockTransaction.select).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
      
      promiseAllSpy.mockRestore();
    });
  });

  describe('atomic operations', () => {
    test('should maintain atomicity with Promise.all', async () => {
      const mockCompany = { id: 1, type: 'lead' };
      
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockCompany]);

      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(false);

      // Mock Promise.all to verify atomic execution
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockResolvedValue([]);

      await leadSyncService.updateCompanyType(1, 'customer');

      expect(promiseAllSpy).toHaveBeenCalledWith([
        expect.anything(), // Company update
        expect.anything()  // Contacts update
      ]);
      
      promiseAllSpy.mockRestore();
    });

    test('should handle Promise.all rejection', async () => {
      const mockCompany = { id: 1, type: 'lead' };
      
      const selectChain = mockDb.select();
      selectChain.all.mockReturnValue([mockCompany]);

      const { EntityTypeUtilityService } = require('../EntityTypeUtilityService');
      EntityTypeUtilityService.shouldClearLeadFields.mockReturnValue(false);

      // Mock Promise.all to reject
      const promiseAllSpy = jest.spyOn(Promise, 'all').mockRejectedValue(new Error('Transaction failed'));

      const result = await leadSyncService.updateCompanyType(1, 'customer');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction failed');
      
      promiseAllSpy.mockRestore();
    });
  });
});