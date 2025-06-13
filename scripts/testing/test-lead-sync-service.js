// Integration test for LeadSyncService
// Tests critical bi-directional operations without needing Jest setup

import { db } from '../../src/lib/db.js';
import { companies, contacts } from '../../src/lib/schema.js';
import { eq } from 'drizzle-orm';

// Test data setup
function setupTestData() {
  console.log('📝 Setting up test data...');
  
  // Create test company
  const company = db
    .insert(companies)
    .values({
      name: 'Test Lead Sync Company',
      type: 'lead',
      lead_status: 'prospect',
      lead_temperature: 'warm',
      lead_source: 'website',
      lead_owner_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .returning({ id: companies.id })
    .get();

  // Create test contacts
  const contact1 = db
    .insert(contacts)
    .values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@testcompany.com',
      company_id: company.id,
      type: 'lead',
      lead_status: 'prospect',
      lead_temperature: 'warm',
      lead_source: 'website',
      lead_owner_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .returning({ id: contacts.id })
    .get();

  const contact2 = db
    .insert(contacts)
    .values({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@testcompany.com',
      company_id: company.id,
      type: 'lead',
      lead_status: 'prospect',
      lead_temperature: 'warm',
      lead_source: 'website',
      lead_owner_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .returning({ id: contacts.id })
    .get();

  return { 
    companyId: company.id, 
    contact1Id: contact1.id, 
    contact2Id: contact2.id 
  };
}

function cleanupTestData(testIds) {
  console.log('🧹 Cleaning up test data...');
  
  // Delete test contacts
  db.delete(contacts)
    .where(eq(contacts.company_id, testIds.companyId))
    .run();

  // Delete test company
  db.delete(companies)
    .where(eq(companies.id, testIds.companyId))
    .run();
}

async function testCompanyTypeSync(testIds) {
  console.log('🧪 Testing company type sync...');
  
  try {
    // Import LeadSyncService (dynamic import for ES modules)
    const { LeadSyncService } = await import('../../src/server/services/LeadSyncService.js');
    const leadSyncService = new LeadSyncService();

    // Test changing company type from 'lead' to 'customer'
    const result = await leadSyncService.updateCompanyType(testIds.companyId, 'customer');
    
    if (!result.success) {
      throw new Error(`Company type update failed: ${result.error}`);
    }

    // Verify company was updated
    const updatedCompany = db
      .select()
      .from(companies)
      .where(eq(companies.id, testIds.companyId))
      .get();

    if (updatedCompany.type !== 'customer') {
      throw new Error(`Company type not updated. Expected: customer, Got: ${updatedCompany.type}`);
    }

    if (updatedCompany.lead_status !== null) {
      throw new Error(`Lead fields not cleared. lead_status: ${updatedCompany.lead_status}`);
    }

    // Verify all contacts were synced
    const updatedContacts = db
      .select()
      .from(contacts)
      .where(eq(contacts.company_id, testIds.companyId))
      .all();

    for (const contact of updatedContacts) {
      if (contact.type !== 'customer') {
        throw new Error(`Contact ${contact.id} type not synced. Expected: customer, Got: ${contact.type}`);
      }
      if (contact.lead_status !== null) {
        throw new Error(`Contact ${contact.id} lead fields not cleared. lead_status: ${contact.lead_status}`);
      }
    }

    console.log('✅ Company type sync test passed');
    return true;
  } catch (error) {
    console.error('❌ Company type sync test failed:', error.message);
    return false;
  }
}

async function testContactTypeSync(testIds) {
  console.log('🧪 Testing contact type sync...');
  
  try {
    const { LeadSyncService } = await import('../../src/server/services/LeadSyncService.js');
    const leadSyncService = new LeadSyncService();

    // First reset data to 'lead' type
    await leadSyncService.updateCompanyType(testIds.companyId, 'lead');

    // Test changing contact type from 'lead' to 'partner'
    const result = await leadSyncService.updateContactType(testIds.contact1Id, 'partner');
    
    if (!result.success) {
      throw new Error(`Contact type update failed: ${result.error}`);
    }

    // Verify contact was updated
    const updatedContact = db
      .select()
      .from(contacts)
      .where(eq(contacts.id, testIds.contact1Id))
      .get();

    if (updatedContact.type !== 'partner') {
      throw new Error(`Contact type not updated. Expected: partner, Got: ${updatedContact.type}`);
    }

    // Verify company was synced
    const updatedCompany = db
      .select()
      .from(companies)
      .where(eq(companies.id, testIds.companyId))
      .get();

    if (updatedCompany.type !== 'partner') {
      throw new Error(`Company type not synced. Expected: partner, Got: ${updatedCompany.type}`);
    }

    // Verify sibling contacts were synced
    const siblingContact = db
      .select()
      .from(contacts)
      .where(eq(contacts.id, testIds.contact2Id))
      .get();

    if (siblingContact.type !== 'partner') {
      throw new Error(`Sibling contact type not synced. Expected: partner, Got: ${siblingContact.type}`);
    }

    console.log('✅ Contact type sync test passed');
    return true;
  } catch (error) {
    console.error('❌ Contact type sync test failed:', error.message);
    return false;
  }
}

async function testLeadDataSync(testIds) {
  console.log('🧪 Testing lead data sync...');
  
  try {
    const { LeadSyncService } = await import('../../src/server/services/LeadSyncService.js');
    const leadSyncService = new LeadSyncService();

    // First reset to lead type
    await leadSyncService.updateCompanyType(testIds.companyId, 'lead');

    // Test updating company lead data
    const leadData = {
      status: 'qualified',
      temperature: 'hot',
      source: 'referral',
      ownerId: 2
    };

    const result = await leadSyncService.updateCompanyLeadData(testIds.companyId, leadData);
    
    if (!result.success) {
      throw new Error(`Company lead data update failed: ${result.error}`);
    }

    // Verify company lead data
    const updatedCompany = db
      .select()
      .from(companies)
      .where(eq(companies.id, testIds.companyId))
      .get();

    if (updatedCompany.lead_status !== 'qualified') {
      throw new Error(`Company lead_status not updated. Expected: qualified, Got: ${updatedCompany.lead_status}`);
    }

    // Verify contacts inherited lead data
    const updatedContacts = db
      .select()
      .from(contacts)
      .where(eq(contacts.company_id, testIds.companyId))
      .all();

    for (const contact of updatedContacts) {
      if (contact.lead_status !== 'qualified') {
        throw new Error(`Contact ${contact.id} lead_status not synced. Expected: qualified, Got: ${contact.lead_status}`);
      }
      if (contact.lead_temperature !== 'hot') {
        throw new Error(`Contact ${contact.id} lead_temperature not synced. Expected: hot, Got: ${contact.lead_temperature}`);
      }
    }

    console.log('✅ Lead data sync test passed');
    return true;
  } catch (error) {
    console.error('❌ Lead data sync test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting LeadSyncService integration tests...\n');
  
  let testIds;
  let allTestsPassed = true;

  try {
    // Setup
    testIds = setupTestData();
    console.log(`📋 Test data created: Company ${testIds.companyId}, Contacts ${testIds.contact1Id}, ${testIds.contact2Id}\n`);

    // Run tests
    const tests = [
      () => testCompanyTypeSync(testIds),
      () => testContactTypeSync(testIds),
      () => testLeadDataSync(testIds)
    ];

    for (const test of tests) {
      const testPassed = await test();
      if (!testPassed) {
        allTestsPassed = false;
      }
      console.log(''); // Add spacing between tests
    }

  } catch (error) {
    console.error('💥 Test setup failed:', error);
    allTestsPassed = false;
  } finally {
    // Cleanup
    if (testIds) {
      cleanupTestData(testIds);
      console.log('✨ Test cleanup completed\n');
    }
  }

  // Results
  if (allTestsPassed) {
    console.log('🎉 All LeadSyncService tests passed!');
    console.log('✅ Bi-directional sync operations are working correctly');
  } else {
    console.log('💥 Some tests failed!');
    console.log('❌ Review the errors above and fix before proceeding');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };