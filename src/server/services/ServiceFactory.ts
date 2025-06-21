import { db } from '@/lib/db';
import { ContactRepository, CompanyRepository, DealRepository, ActivityRepository, ActivityParticipantRepository } from '@/server/repositories';
import { ContactService } from './ContactService';
import { CompanyService } from './CompanyService';
import { DealService } from './DealService';
import { LeadSyncService } from './LeadSyncService';
import { OfferingService } from './OfferingService';
import { ActivityService } from './ActivityService';

/**
 * Service factory for creating service instances with proper dependency injection
 * This provides a centralized way to create services with their dependencies
 * and makes testing easier by allowing dependency mocking
 */
export class ServiceFactory {
  private static instance?: ServiceFactory;
  
  // Repository instances (shared across services)
  private readonly contactRepo: ContactRepository;
  private readonly companyRepo: CompanyRepository;
  private readonly dealRepo: DealRepository;
  private readonly activityRepo: ActivityRepository;
  private readonly activityParticipantRepo: ActivityParticipantRepository;
  
  // Service instances (created on demand)
  private leadSyncService?: LeadSyncService;
  private contactService?: ContactService;
  private companyService?: CompanyService;
  private dealService?: DealService;
  private offeringService?: OfferingService;
  private activityService?: ActivityService;

  constructor(
    // Allow dependency injection for testing
    contactRepo?: ContactRepository,
    companyRepo?: CompanyRepository,
    dealRepo?: DealRepository,
    activityRepo?: ActivityRepository,
    activityParticipantRepo?: ActivityParticipantRepository
  ) {
    this.contactRepo = contactRepo || new ContactRepository();
    this.companyRepo = companyRepo || new CompanyRepository();
    this.dealRepo = dealRepo || new DealRepository();
    this.activityRepo = activityRepo || new ActivityRepository();
    this.activityParticipantRepo = activityParticipantRepo || new ActivityParticipantRepository();
  }

  /**
   * Get singleton instance for production use
   */
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Create a new factory instance for testing with custom dependencies
   */
  static createTestInstance(
    contactRepo?: ContactRepository,
    companyRepo?: CompanyRepository,
    dealRepo?: DealRepository,
    activityRepo?: ActivityRepository,
    activityParticipantRepo?: ActivityParticipantRepository
  ): ServiceFactory {
    return new ServiceFactory(contactRepo, companyRepo, dealRepo, activityRepo, activityParticipantRepo);
  }

  /**
   * Get LeadSyncService instance
   */
  getLeadSyncService(): LeadSyncService {
    if (!this.leadSyncService) {
      this.leadSyncService = new LeadSyncService(db);
    }
    return this.leadSyncService;
  }

  /**
   * Get ContactService instance with injected dependencies
   */
  getContactService(): ContactService {
    if (!this.contactService) {
      this.contactService = new ContactService(
        this.contactRepo,
        this.getLeadSyncService()
      );
    }
    return this.contactService;
  }

  /**
   * Get CompanyService instance with injected dependencies
   */
  getCompanyService(): CompanyService {
    if (!this.companyService) {
      this.companyService = new CompanyService(
        this.companyRepo,
        this.getLeadSyncService()
      );
    }
    return this.companyService;
  }

  /**
   * Get DealService instance with injected dependencies
   */
  getDealService(): DealService {
    if (!this.dealService) {
      this.dealService = new DealService(this.dealRepo);
    }
    return this.dealService;
  }

  /**
   * Get OfferingService instance
   */
  getOfferingService(): OfferingService {
    if (!this.offeringService) {
      this.offeringService = new OfferingService();
    }
    return this.offeringService;
  }

  /**
   * Get ActivityService instance with injected dependencies
   */
  getActivityService(): ActivityService {
    if (!this.activityService) {
      this.activityService = new ActivityService(
        this.activityRepo,
        this.activityParticipantRepo,
        this.contactRepo,
        this.companyRepo,
        this.dealRepo,
        this.getLeadSyncService()
      );
    }
    return this.activityService;
  }

  /**
   * Clear service cache (useful for testing)
   */
  clearCache(): void {
    this.leadSyncService = undefined;
    this.contactService = undefined;
    this.companyService = undefined;
    this.dealService = undefined;
    this.offeringService = undefined;
    this.activityService = undefined;
  }
}

/**
 * Convenience factory functions for production use
 */
export const serviceFactory = ServiceFactory.getInstance();

/**
 * Factory functions for each service type
 */
export function makeContactService(): ContactService {
  return serviceFactory.getContactService();
}

export function makeCompanyService(): CompanyService {
  return serviceFactory.getCompanyService();
}

export function makeDealService(): DealService {
  return serviceFactory.getDealService();
}

export function makeLeadSyncService(): LeadSyncService {
  return serviceFactory.getLeadSyncService();
}

export function makeOfferingService(): OfferingService {
  return serviceFactory.getOfferingService();
}

export function makeActivityService(): ActivityService {
  return serviceFactory.getActivityService();
}