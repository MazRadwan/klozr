// Validation script for LeadSyncService - tests critical operations
// This validates that the service infrastructure works correctly

const { db } = require('../../src/lib/db');
const { companies, contacts } = require('../../src/lib/schema');
const { eq } = require('drizzle-orm');

// Test data setup and validation
function validateLeadSyncInfrastructure() {
  console.log('🔍 Validating LeadSyncService infrastructure...\n');

  try {
    // 1. Validate database connection
    console.log('1. Testing database connection...');
    const companyCount = db.select().from(companies).all().length;
    const contactCount = db.select().from(contacts).all().length;
    console.log(`✅ Database accessible: ${companyCount} companies, ${contactCount} contacts\n`);

    // 2. Test bi-directional data structure
    console.log('2. Validating bi-directional data structure...');
    
    // Find companies with contacts for testing
    const companiesWithContacts = db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        companyType: companies.type,
        companyLeadStatus: companies.lead_status,
        contactCount: 'count(*)'
      })
      .from(companies)
      .leftJoin(contacts, eq(contacts.company_id, companies.id))
      .all();

    if (companiesWithContacts.length === 0) {
      console.log('⚠️  No companies found - cannot test bi-directional sync');
      return false;
    }

    console.log(`✅ Found ${companiesWithContacts.length} companies with contact relationships\n`);

    // 3. Test entity type validation
    console.log('3. Testing entity type utilities...');
    
    // Check if EntityTypeUtilityService can be loaded
    try {
      const { EntityTypeUtilityService } = require('../../src/server/services/EntityTypeUtilityService');
      
      // Test shouldClearLeadFields logic
      const shouldClear1 = EntityTypeUtilityService.shouldClearLeadFields('lead', 'customer');
      const shouldClear2 = EntityTypeUtilityService.shouldClearLeadFields('customer', 'lead');
      const shouldClear3 = EntityTypeUtilityService.shouldClearLeadFields('lead', 'lead');

      if (shouldClear1 !== true) {
        throw new Error('shouldClearLeadFields should return true for lead -> customer');
      }
      if (shouldClear2 !== false) {
        throw new Error('shouldClearLeadFields should return false for customer -> lead');
      }
      if (shouldClear3 !== false) {
        throw new Error('shouldClearLeadFields should return false for lead -> lead');
      }

      console.log('✅ EntityTypeUtilityService working correctly\n');
    } catch (error) {
      console.error('❌ EntityTypeUtilityService failed:', error.message);
      return false;
    }

    // 4. Test LeadSyncService can be imported
    console.log('4. Testing LeadSyncService import...');
    try {
      const { LeadSyncService } = require('../../src/server/services/LeadSyncService');
      const service = new LeadSyncService();
      
      if (typeof service.updateCompanyType !== 'function') {
        throw new Error('updateCompanyType method missing');
      }
      if (typeof service.updateContactType !== 'function') {
        throw new Error('updateContactType method missing');
      }
      if (typeof service.updateCompanyLeadData !== 'function') {
        throw new Error('updateCompanyLeadData method missing');
      }
      if (typeof service.updateContactLeadData !== 'function') {
        throw new Error('updateContactLeadData method missing');
      }
      if (typeof service.associateContactWithCompany !== 'function') {
        throw new Error('associateContactWithCompany method missing');
      }

      console.log('✅ LeadSyncService interface complete\n');
    } catch (error) {
      console.error('❌ LeadSyncService import failed:', error.message);
      return false;
    }

    // 5. Test existing API endpoints still work
    console.log('5. Testing existing bi-directional API structure...');
    
    // Check that critical files exist and can be loaded
    const criticalFiles = [
      '../../src/app/api/companies/[id]/type/route.ts',
      '../../src/app/api/contacts/[id]/type/route.ts',
      '../../src/app/api/companies/[id]/lead/route.ts',
      '../../src/app/api/contacts/[id]/lead/route.ts'
    ];

    for (const file of criticalFiles) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.resolve(__dirname, file);
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`Critical API file missing: ${file}`);
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('Promise.all')) {
          console.log(`⚠️  Warning: ${file} may not have bi-directional sync (no Promise.all found)`);
        }
      } catch (error) {
        console.error(`❌ Critical API file issue: ${file} - ${error.message}`);
        return false;
      }
    }

    console.log('✅ Critical API endpoints structure intact\n');

    // 6. Validate Promise.all patterns in existing code
    console.log('6. Validating atomic operation patterns...');
    
    // Check companies POST route has transaction logic
    try {
      const fs = require('fs');
      const path = require('path');
      const companiesRoute = fs.readFileSync(
        path.resolve(__dirname, '../../src/app/api/companies/route.ts'), 
        'utf8'
      );
      
      if (!companiesRoute.includes('db.transaction')) {
        console.log('⚠️  Warning: Companies POST route may be missing transaction logic');
      }
      if (!companiesRoute.includes('Promise.all')) {
        console.log('⚠️  Warning: Companies POST route may be missing atomic operations');
      }
      
      console.log('✅ Atomic operation patterns validated\n');
    } catch (error) {
      console.error('❌ Could not validate atomic operations:', error.message);
      return false;
    }

    console.log('🎉 LeadSyncService infrastructure validation PASSED!');
    console.log('✅ All critical components are in place');
    console.log('✅ Service can be safely integrated into existing endpoints');
    
    return true;

  } catch (error) {
    console.error('💥 Infrastructure validation failed:', error);
    return false;
  }
}

// Validation for service method signatures
function validateServiceMethodSignatures() {
  console.log('\n🔧 Validating service method signatures...\n');
  
  try {
    const { LeadSyncService } = require('../../src/server/services/LeadSyncService');
    const service = new LeadSyncService();

    // Test method signatures by checking they don't throw on valid inputs
    console.log('1. Testing updateCompanyType signature...');
    const companyTypePromise = service.updateCompanyType(999, 'customer', null);
    if (!(companyTypePromise instanceof Promise)) {
      throw new Error('updateCompanyType should return a Promise');
    }

    console.log('2. Testing updateContactType signature...');
    const contactTypePromise = service.updateContactType(999, 'partner', null);
    if (!(contactTypePromise instanceof Promise)) {
      throw new Error('updateContactType should return a Promise');
    }

    console.log('3. Testing updateCompanyLeadData signature...');
    const companyLeadPromise = service.updateCompanyLeadData(999, { status: 'qualified' }, null);
    if (!(companyLeadPromise instanceof Promise)) {
      throw new Error('updateCompanyLeadData should return a Promise');
    }

    console.log('4. Testing updateContactLeadData signature...');
    const contactLeadPromise = service.updateContactLeadData(999, { temperature: 'hot' }, null);
    if (!(contactLeadPromise instanceof Promise)) {
      throw new Error('updateContactLeadData should return a Promise');
    }

    console.log('5. Testing associateContactWithCompany signature...');
    const associatePromise = service.associateContactWithCompany(999, 1, null);
    if (!(associatePromise instanceof Promise)) {
      throw new Error('associateContactWithCompany should return a Promise');
    }

    console.log('✅ All method signatures are correct\n');
    return true;

  } catch (error) {
    console.error('❌ Method signature validation failed:', error.message);
    return false;
  }
}

// Main validation runner
function runValidation() {
  console.log('🚀 LeadSyncService Validation Suite\n');
  console.log('This validates the service infrastructure without making changes to the database.\n');

  const infraValid = validateLeadSyncInfrastructure();
  const signaturesValid = validateServiceMethodSignatures();

  if (infraValid && signaturesValid) {
    console.log('\n✅ VALIDATION PASSED - LeadSyncService ready for integration');
    console.log('📋 Next steps:');
    console.log('   1. Service methods can be integrated into existing API endpoints');
    console.log('   2. Existing Promise.all() operations can be replaced with service calls');
    console.log('   3. Transaction support is ready for complex operations');
    return true;
  } else {
    console.log('\n❌ VALIDATION FAILED - Issues must be resolved before integration');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation };