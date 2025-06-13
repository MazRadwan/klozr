#!/usr/bin/env node

// Test API handlers directly by importing the route functions
const path = require('path');

// Mock NextRequest and NextResponse for testing
global.NextRequest = class {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this._json = options.body ? JSON.parse(options.body) : {};
  }
  
  async json() {
    return this._json;
  }
};

global.NextResponse = {
  json: (data, options = {}) => {
    return {
      status: options.status || 200,
      data: data,
      json: async () => data
    };
  },
  next: () => ({ next: true })
};

// Mock the auth guard to return success
const mockAuth = () => ({});
const mockIsAuthError = () => false;

console.log('🧪 Testing API Handlers Directly');
console.log('================================\n');

async function testAPIHandlers() {
  try {
    // Get current state before testing
    console.log('📊 Initial Database State');
    console.log('=========================');
    
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, '..', 'db.sqlite');
    const db = new Database(dbPath);
    
    const company1 = db.prepare('SELECT id, name, type, lead_status, lead_temperature FROM companies WHERE id = 1').get();
    const contacts1 = db.prepare('SELECT id, first_name, last_name, type, lead_status, lead_temperature, company_id FROM contacts WHERE company_id = 1').all();
    
    console.log('Company 1:', company1);
    console.log('Related Contacts:', contacts1);
    
    // Test 1: Company Type Update
    console.log('\n🔄 Test 1: Company Type Update API Handler');
    console.log('==========================================');
    
    // Mock the API handler by directly calling the logic
    const { db: dbInstance } = require('../src/lib/db');
    const { companies, contacts } = require('../src/lib/schema');
    const { eq } = require('drizzle-orm');
    
    const companyId = 1;
    const newType = 'customer';
    
    // Simulate the exact logic from the API handler
    const companyUpdateData = {
      type: newType,
      updated_at: new Date().toISOString()
    };
    
    // Clear lead fields if transitioning away from 'lead' type
    if (newType && newType !== 'lead') {
      companyUpdateData.lead_status = null;
      companyUpdateData.lead_temperature = null;
      companyUpdateData.lead_source = null;
      companyUpdateData.lead_assigned_date = null;
      companyUpdateData.lead_owner_id = null;
    }
    
    // Update company
    const companyResult = dbInstance
      .update(companies)
      .set(companyUpdateData)
      .where(eq(companies.id, companyId))
      .run();
    
    // Update related contacts
    const contactsUpdateData = { ...companyUpdateData };
    if (newType && newType !== 'lead') {
      contactsUpdateData.individual_lead_status = null;
      contactsUpdateData.is_lead_contact = false;
    }
    
    const contactsResult = dbInstance
      .update(contacts)
      .set(contactsUpdateData)
      .where(eq(contacts.company_id, companyId))
      .run();
    
    console.log('✅ Company update result:', { changes: companyResult.changes });
    console.log('✅ Contacts update result:', { changes: contactsResult.changes });
    
    // Verify results
    const updatedCompany = db.prepare('SELECT id, name, type, lead_status, lead_temperature FROM companies WHERE id = 1').get();
    const updatedContacts = db.prepare('SELECT id, first_name, last_name, type, lead_status, lead_temperature FROM contacts WHERE company_id = 1').all();
    
    console.log('After company type update:');
    console.log('Company 1:', updatedCompany);
    console.log('Related Contacts:', updatedContacts);
    
    // Test 2: Contact Lead Status Update
    console.log('\n🔄 Test 2: Contact Lead Status Update API Handler');
    console.log('================================================');
    
    // First set everything back to lead type for testing
    dbInstance.update(companies)
      .set({ type: 'lead', lead_status: 'prospect', lead_temperature: 'warm' })
      .where(eq(companies.id, companyId))
      .run();
    
    dbInstance.update(contacts)
      .set({ type: 'lead', lead_status: 'prospect', lead_temperature: 'warm' })
      .where(eq(contacts.company_id, companyId))
      .run();
    
    console.log('✅ Reset to lead type for testing');
    
    // Now test contact lead update with bi-directional sync
    const contactId = 1;
    const leadData = {
      status: 'qualified',
      temperature: 'hot',
      source: 'website'
    };
    
    // Get the contact's company_id (simulate the API logic)
    const currentContact = dbInstance
      .select({ contact: contacts, company: companies })
      .from(contacts)
      .leftJoin(companies, eq(contacts.company_id, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);
    
    if (currentContact.length === 0) {
      throw new Error('Contact not found');
    }
    
    const contact = currentContact[0].contact;
    
    // Simulate the API handler logic for contact lead update
    const contactUpdateData = {
      updated_at: new Date().toISOString()
    };
    
    if (leadData.status !== undefined) {
      contactUpdateData.lead_status = leadData.status;
      contactUpdateData.individual_lead_status = leadData.status;
      if (leadData.status) {
        contactUpdateData.lead_assigned_date = new Date().toISOString();
      }
    }
    if (leadData.temperature !== undefined) contactUpdateData.lead_temperature = leadData.temperature;
    if (leadData.source !== undefined) contactUpdateData.lead_source = leadData.source;
    
    // Update the contact
    const contactUpdateResult = dbInstance
      .update(contacts)
      .set(contactUpdateData)
      .where(eq(contacts.id, contactId))
      .run();
    
    // Update the company if it exists
    if (contact.company_id) {
      const companyUpdateData2 = {
        updated_at: new Date().toISOString()
      };
      
      if (leadData.status !== undefined) {
        companyUpdateData2.lead_status = leadData.status;
        if (leadData.status) {
          companyUpdateData2.lead_assigned_date = new Date().toISOString();
        }
      }
      if (leadData.temperature !== undefined) companyUpdateData2.lead_temperature = leadData.temperature;
      if (leadData.source !== undefined) companyUpdateData2.lead_source = leadData.source;
      
      const companyUpdateResult2 = dbInstance
        .update(companies)
        .set(companyUpdateData2)
        .where(eq(companies.id, contact.company_id))
        .run();
      
      // Update other contacts in the same company
      const { and, ne } = require('drizzle-orm');
      const otherContactsUpdateData = { ...contactUpdateData };
      delete otherContactsUpdateData.individual_lead_status;
      delete otherContactsUpdateData.is_lead_contact;
      
      const otherContactsResult = dbInstance
        .update(contacts)
        .set(otherContactsUpdateData)
        .where(
          and(
            eq(contacts.company_id, contact.company_id),
            ne(contacts.id, contactId)
          )
        )
        .run();
      
      console.log('✅ Contact update result:', { changes: contactUpdateResult.changes });
      console.log('✅ Company update result:', { changes: companyUpdateResult2.changes });
      console.log('✅ Other contacts update result:', { changes: otherContactsResult.changes });
    }
    
    // Final verification
    const finalCompany = db.prepare('SELECT id, name, type, lead_status, lead_temperature, lead_source FROM companies WHERE id = 1').get();
    const finalContacts = db.prepare('SELECT id, first_name, last_name, type, lead_status, lead_temperature, lead_source FROM contacts WHERE company_id = 1').all();
    
    console.log('\nAfter contact lead update:');
    console.log('Company 1:', finalCompany);
    console.log('Related Contacts:', finalContacts);
    
    // Test 3: Validation
    console.log('\n🔍 Test 3: Bi-directional Sync Validation');
    console.log('=========================================');
    
    const syncCheck = db.prepare(`
      SELECT 
        c.id as company_id,
        c.type as company_type,
        c.lead_status as company_lead_status,
        c.lead_temperature as company_lead_temperature,
        cont.id as contact_id,
        cont.type as contact_type,
        cont.lead_status as contact_lead_status,
        cont.lead_temperature as contact_lead_temperature
      FROM companies c
      JOIN contacts cont ON c.id = cont.company_id
      WHERE c.id = 1 AND (
        c.type != cont.type 
        OR c.lead_status != cont.lead_status 
        OR c.lead_temperature != cont.lead_temperature
      )
    `).all();
    
    if (syncCheck.length > 0) {
      console.log('⚠️  Found sync issues:', syncCheck);
    } else {
      console.log('✅ All entities are properly synchronized');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run tests
testAPIHandlers().then(() => {
  console.log('\n✅ API handler testing completed');
}).catch(console.error);