/**
 * Test utilities for service testing with dependency injection
 * This demonstrates how the ServiceFactory enables comprehensive testing
 */

import { ServiceFactory } from '../ServiceFactory';
import { ContactRepository, CompanyRepository, DealRepository } from '@/server/repositories';

/**
 * Mock repositories that can be used for testing
 * These provide controlled, predictable data for testing service logic
 */
export class MockContactRepository extends ContactRepository {
  private mockData: any[] = [];

  constructor(mockData: any[] = []) {
    super();
    this.mockData = mockData;
  }

  async findAll() {
    return this.mockData;
  }

  async findById(id: number) {
    return this.mockData.find(item => item.id === id) || null;
  }

  async findByCompany(companyId: number) {
    return this.mockData.filter(item => item.company_id === companyId);
  }

  async search(query: string) {
    return this.mockData.filter(item => 
      item.first_name?.includes(query) || 
      item.last_name?.includes(query) ||
      item.email?.includes(query)
    );
  }

  setMockData(data: any[]) {
    this.mockData = data;
  }
}

export class MockCompanyRepository extends CompanyRepository {
  private mockData: any[] = [];

  constructor(mockData: any[] = []) {
    super();
    this.mockData = mockData;
  }

  async findAll() {
    return this.mockData;
  }

  async findById(id: number) {
    return this.mockData.find(item => item.id === id) || null;
  }

  async search(query: string) {
    return this.mockData.filter(item => 
      item.name?.includes(query) || 
      item.industry?.includes(query)
    );
  }

  setMockData(data: any[]) {
    this.mockData = data;
  }
}

export class MockDealRepository extends DealRepository {
  private mockData: any[] = [];

  constructor(mockData: any[] = []) {
    super();
    this.mockData = mockData;
  }

  async findAll() {
    return this.mockData;
  }

  async findById(id: number) {
    return this.mockData.find(item => item.id === id) || null;
  }

  setMockData(data: any[]) {
    this.mockData = data;
  }
}

/**
 * Test factory setup utility
 * Creates a ServiceFactory with mocked dependencies for testing
 */
export function createTestServiceFactory(options: {
  contacts?: any[];
  companies?: any[];
  deals?: any[];
} = {}) {
  const mockContactRepo = new MockContactRepository(options.contacts);
  const mockCompanyRepo = new MockCompanyRepository(options.companies);
  const mockDealRepo = new MockDealRepository(options.deals);

  return ServiceFactory.createTestInstance(
    mockContactRepo,
    mockCompanyRepo,
    mockDealRepo
  );
}

/**
 * Example test data
 */
export const mockTestData = {
  contacts: [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@testcompany.com',
      company_id: 1,
      type: 'lead',
      lead_status: 'prospect'
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@testcompany.com',
      company_id: 1,
      type: 'lead',
      lead_status: 'prospect'
    }
  ],
  companies: [
    {
      id: 1,
      name: 'Test Company Inc',
      type: 'lead',
      lead_status: 'prospect',
      lead_temperature: 'warm',
      industry: 'Technology'
    }
  ],
  deals: [
    {
      id: 1,
      title: 'Q1 Software Deal',
      amount: 50000,
      company_id: 1,
      status: 'open'
    }
  ]
};

/**
 * Example test demonstrating the improved testability
 */
export async function exampleServiceTest() {
  // Create a test factory with controlled data
  const testFactory = createTestServiceFactory({
    contacts: mockTestData.contacts,
    companies: mockTestData.companies
  });

  // Get service instances with mocked dependencies
  const contactService = testFactory.getContactService();
  const companyService = testFactory.getCompanyService();

  // Now we can test service logic without hitting real database
  const contacts = await contactService.getContacts();
  const companies = await companyService.getCompanies();

  console.log('Test Results:');
  console.log('Contacts:', contacts.length);
  console.log('Companies:', companies.length);

  return { contacts, companies };
}

/**
 * Utility for testing API routes with mocked services
 * This could be used to test route handlers in isolation
 */
export function createMockServiceFactoryForRoute() {
  // This function would return factory functions that create mocked services
  // for testing route handlers without real dependencies
  
  return {
    makeContactService: () => createTestServiceFactory().getContactService(),
    makeCompanyService: () => createTestServiceFactory().getCompanyService(),
    makeDealService: () => createTestServiceFactory().getDealService(),
    makeLeadSyncService: () => createTestServiceFactory().getLeadSyncService()
  };
}