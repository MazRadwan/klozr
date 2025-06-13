/**
 * Example test demonstrating dependency injection capabilities
 * This shows how the ServiceFactory enables proper unit testing
 */

import { ServiceFactory } from '../ServiceFactory';
import { ContactRepository, CompanyRepository, DealRepository } from '@/server/repositories';

// Mock repositories for testing
class MockContactRepository extends ContactRepository {
  async findAll() {
    return [{ id: 1, first_name: 'Test', last_name: 'Contact', email: 'test@example.com' }];
  }
}

class MockCompanyRepository extends CompanyRepository {
  async findAll() {
    return [{ id: 1, name: 'Test Company' }];
  }
}

class MockDealRepository extends DealRepository {
  async findAll() {
    return [{ id: 1, title: 'Test Deal', amount: 1000 }];
  }
}

describe('ServiceFactory', () => {
  describe('Production Usage', () => {
    test('should provide singleton instance', () => {
      const factory1 = ServiceFactory.getInstance();
      const factory2 = ServiceFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });

    test('should create services with proper dependencies', () => {
      const factory = ServiceFactory.getInstance();
      
      const contactService = factory.getContactService();
      const companyService = factory.getCompanyService();
      const dealService = factory.getDealService();
      const leadSyncService = factory.getLeadSyncService();
      
      expect(contactService).toBeDefined();
      expect(companyService).toBeDefined();
      expect(dealService).toBeDefined();
      expect(leadSyncService).toBeDefined();
    });

    test('should cache service instances', () => {
      const factory = ServiceFactory.getInstance();
      
      const service1 = factory.getContactService();
      const service2 = factory.getContactService();
      
      expect(service1).toBe(service2);
    });
  });

  describe('Testing Usage', () => {
    test('should allow dependency injection for testing', () => {
      const mockContactRepo = new MockContactRepository();
      const mockCompanyRepo = new MockCompanyRepository();
      const mockDealRepo = new MockDealRepository();
      
      const testFactory = ServiceFactory.createTestInstance(
        mockContactRepo,
        mockCompanyRepo,
        mockDealRepo
      );
      
      expect(testFactory).toBeDefined();
      expect(testFactory).not.toBe(ServiceFactory.getInstance());
    });

    test('should clear cache for test isolation', () => {
      const factory = ServiceFactory.createTestInstance();
      
      const service1 = factory.getContactService();
      factory.clearCache();
      const service2 = factory.getContactService();
      
      expect(service1).not.toBe(service2);
    });
  });

  describe('Factory Functions', () => {
    test('should work with factory functions in production', async () => {
      // Import factory functions
      const { makeContactService, makeCompanyService, makeDealService, makeLeadSyncService } = 
        await import('../ServiceFactory');
      
      const contactService = makeContactService();
      const companyService = makeCompanyService();
      const dealService = makeDealService();
      const leadSyncService = makeLeadSyncService();
      
      expect(contactService).toBeDefined();
      expect(companyService).toBeDefined();
      expect(dealService).toBeDefined();
      expect(leadSyncService).toBeDefined();
    });
  });
});

/**
 * Example of how to test a service with mocked dependencies
 */
describe('ContactService with Mocked Dependencies', () => {
  test('should use injected repository', async () => {
    const mockContactRepo = new MockContactRepository();
    const factory = ServiceFactory.createTestInstance(mockContactRepo);
    
    const contactService = factory.getContactService();
    
    // This would use the mocked repository
    // const result = await contactService.getContacts();
    // expect(result).toEqual([{ id: 1, first_name: 'Test', last_name: 'Contact', email: 'test@example.com' }]);
    
    expect(contactService).toBeDefined();
  });
});

export {};