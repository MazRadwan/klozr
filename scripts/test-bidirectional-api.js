#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'db.sqlite');

console.log('🧪 Testing Bi-Directional API Logic');
console.log('===================================\n');

const db = new Database(dbPath);

// Helper function to get company with contacts
function getCompanyWithContacts(companyId) {
  const company = db.prepare(`
    SELECT id, name, type, lead_status, lead_temperature, lead_source 
    FROM companies WHERE id = ?
  `).get(companyId);
  
  const contacts = db.prepare(`
    SELECT id, first_name, last_name, type, lead_status, lead_temperature, lead_source, company_id
    FROM contacts WHERE company_id = ?
  `).all(companyId);
  
  return { company, contacts };
}

// Test 1: Check initial state
console.log('📊 Initial State Check');
console.log('=====================');
const initial = getCompanyWithContacts(1);
console.log('Company 1:', JSON.stringify(initial.company, null, 2));
console.log('Related Contacts:', initial.contacts.map(c => ({
  id: c.id,
  name: `${c.first_name} ${c.last_name}`,
  type: c.type,
  lead_status: c.lead_status,
  lead_temperature: c.lead_temperature
})));

// Test 2: Simulate Company Type Update (lead -> customer)
console.log('\n🔄 Test 2: Company Type Update (lead -> customer)');
console.log('================================================');

try {
  // Start transaction
  const updateCompanyType = db.transaction((companyId, newType) => {
    const updates = [];
    
    // Prepare company update data
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
    const companyUpdate = db.prepare(`
      UPDATE companies 
      SET type = ?, lead_status = ?, lead_temperature = ?, lead_source = ?, 
          lead_assigned_date = ?, lead_owner_id = ?, updated_at = ?
      WHERE id = ?
    `);
    
    companyUpdate.run(
      companyUpdateData.type,
      companyUpdateData.lead_status,
      companyUpdateData.lead_temperature,
      companyUpdateData.lead_source,
      companyUpdateData.lead_assigned_date,
      companyUpdateData.lead_owner_id,
      companyUpdateData.updated_at,
      companyId
    );
    
    // Update all related contacts
    const contactsUpdateData = { ...companyUpdateData };
    if (newType && newType !== 'lead') {
      contactsUpdateData.individual_lead_status = null;
      contactsUpdateData.is_lead_contact = false;
    }
    
    const contactUpdate = db.prepare(`
      UPDATE contacts 
      SET type = ?, lead_status = ?, lead_temperature = ?, lead_source = ?, 
          lead_assigned_date = ?, lead_owner_id = ?, individual_lead_status = ?, 
          is_lead_contact = ?, updated_at = ?
      WHERE company_id = ?
    `);
    
    contactUpdate.run(
      contactsUpdateData.type,
      contactsUpdateData.lead_status,
      contactsUpdateData.lead_temperature,
      contactsUpdateData.lead_source,
      contactsUpdateData.lead_assigned_date,
      contactsUpdateData.lead_owner_id,
      contactsUpdateData.individual_lead_status,
      contactsUpdateData.is_lead_contact ? 1 : 0,
      contactsUpdateData.updated_at,
      companyId
    );
    
    return { companyChanges: companyUpdate.changes, contactChanges: contactUpdate.changes };
  });
  
  // Execute the transaction
  const result = updateCompanyType(1, 'customer');
  console.log('✅ Update completed:', result);
  
  // Check results
  const afterUpdate = getCompanyWithContacts(1);
  console.log('\nAfter company type update to "customer":');
  console.log('Company 1:', JSON.stringify(afterUpdate.company, null, 2));
  console.log('Related Contacts:', afterUpdate.contacts.map(c => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    type: c.type,
    lead_status: c.lead_status,
    lead_temperature: c.lead_temperature
  })));
  
} catch (error) {
  console.error('❌ Error during company type update:', error);
}

// Test 3: Simulate Contact Lead Status Update
console.log('\n🔄 Test 3: Contact Lead Status Update');
console.log('===================================');

try {
  // First, set company back to lead type and add some lead data
  console.log('Setting up test data...');
  db.prepare(`
    UPDATE companies 
    SET type = 'lead', lead_status = 'prospect', lead_temperature = 'warm'
    WHERE id = 1
  `).run();
  
  db.prepare(`
    UPDATE contacts 
    SET type = 'lead', lead_status = 'prospect', lead_temperature = 'warm'
    WHERE company_id = 1
  `).run();
  
  console.log('✅ Test data setup complete');
  
  // Now test contact lead status update with bi-directional sync
  const updateContactLead = db.transaction((contactId, leadData) => {
    // Get contact's company_id first
    const contact = db.prepare('SELECT company_id FROM contacts WHERE id = ?').get(contactId);
    
    if (!contact || !contact.company_id) {
      throw new Error('Contact not found or has no company');
    }
    
    // Update the contact
    const contactUpdate = db.prepare(`
      UPDATE contacts 
      SET lead_status = ?, lead_temperature = ?, lead_source = ?, 
          lead_owner_id = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const contactResult = contactUpdate.run(
      leadData.status,
      leadData.temperature,
      leadData.source,
      leadData.ownerId,
      new Date().toISOString(),
      contactId
    );
    
    // Update the company
    const companyUpdate = db.prepare(`
      UPDATE companies 
      SET lead_status = ?, lead_temperature = ?, lead_source = ?, 
          lead_owner_id = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const companyResult = companyUpdate.run(
      leadData.status,
      leadData.temperature,
      leadData.source,
      leadData.ownerId,
      new Date().toISOString(),
      contact.company_id
    );
    
    // Update other contacts in the same company
    const otherContactsUpdate = db.prepare(`
      UPDATE contacts 
      SET lead_status = ?, lead_temperature = ?, lead_source = ?, 
          lead_owner_id = ?, updated_at = ?
      WHERE company_id = ? AND id != ?
    `);
    
    const otherContactsResult = otherContactsUpdate.run(
      leadData.status,
      leadData.temperature,
      leadData.source,
      leadData.ownerId,
      new Date().toISOString(),
      contact.company_id,
      contactId
    );
    
    return {
      contactChanges: contactResult.changes,
      companyChanges: companyResult.changes,
      otherContactsChanges: otherContactsResult.changes
    };
  });
  
  // Execute update - change contact 1's lead status to "qualified" and temperature to "hot"
  const leadUpdateResult = updateContactLead(1, {
    status: 'qualified',
    temperature: 'hot',
    source: 'website',
    ownerId: null
  });
  
  console.log('✅ Contact lead update completed:', leadUpdateResult);
  
  // Check results
  const afterLeadUpdate = getCompanyWithContacts(1);
  console.log('\nAfter contact 1 lead status update:');
  console.log('Company 1:', JSON.stringify(afterLeadUpdate.company, null, 2));
  console.log('Related Contacts:', afterLeadUpdate.contacts.map(c => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    type: c.type,
    lead_status: c.lead_status,
    lead_temperature: c.lead_temperature,
    lead_source: c.lead_source
  })));
  
} catch (error) {
  console.error('❌ Error during contact lead update:', error);
}

// Test 4: Validation Check
console.log('\n🔍 Test 4: Final Validation');
console.log('===========================');

try {
  // Check for sync mismatches
  const mismatchQuery = `
    SELECT 
      c.id as company_id,
      c.name as company_name,
      c.type as company_type,
      c.lead_status as company_lead_status,
      c.lead_temperature as company_lead_temperature,
      cont.id as contact_id,
      cont.first_name || ' ' || cont.last_name as contact_name,
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
  `;
  
  const mismatches = db.prepare(mismatchQuery).all();
  
  if (mismatches.length > 0) {
    console.log('⚠️  Found sync mismatches:');
    mismatches.forEach((mismatch, i) => {
      console.log(`${i + 1}. Contact: ${mismatch.contact_name} (ID: ${mismatch.contact_id})`);
      console.log(`   Type: Company="${mismatch.company_type}" vs Contact="${mismatch.contact_type}"`);
      console.log(`   Status: Company="${mismatch.company_lead_status}" vs Contact="${mismatch.contact_lead_status}"`);
      console.log(`   Temp: Company="${mismatch.company_lead_temperature}" vs Contact="${mismatch.contact_lead_temperature}"`);
    });
  } else {
    console.log('✅ All entities are properly synchronized');
  }
  
} catch (error) {
  console.error('❌ Error during validation:', error);
}

db.close();
console.log('\n✅ Bi-directional API testing completed');