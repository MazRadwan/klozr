#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'db.sqlite');

console.log('🔍 Database Schema Inspection Tool');
console.log('==================================\n');

try {
  const db = new Database(dbPath, { readonly: true });

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  
  console.log('📋 Tables in database:');
  tables.forEach((table, i) => {
    console.log(`${i + 1}. ${table.name}`);
  });
  console.log('');

  // Inspect companies and contacts tables specifically
  const inspectTable = (tableName) => {
    console.log(`🔍 Table: ${tableName}`);
    console.log('=' .repeat(50));
    
    // Get table info
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    
    console.log('Columns:');
    tableInfo.forEach(col => {
      const nullable = col.notnull ? 'NOT NULL' : 'NULLABLE';
      const primaryKey = col.pk ? ' (PRIMARY KEY)' : '';
      const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
      console.log(`  - ${col.name}: ${col.type} ${nullable}${defaultVal}${primaryKey}`);
    });
    
    // Get record count
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`\nRecord count: ${count.count}`);
    } catch (err) {
      console.log(`\nCould not get record count: ${err.message}`);
    }
    
    // Sample records with entity types and lead fields
    if (tableName === 'companies' || tableName === 'contacts') {
      try {
        const sampleQuery = tableName === 'companies' 
          ? `SELECT id, name, type, lead_status, lead_temperature, lead_source FROM companies LIMIT 5`
          : `SELECT id, first_name, last_name, type, lead_status, lead_temperature, lead_source, company_id FROM contacts LIMIT 5`;
        
        const samples = db.prepare(sampleQuery).all();
        if (samples.length > 0) {
          console.log('\nSample records:');
          samples.forEach((record, i) => {
            console.log(`  ${i + 1}. ${JSON.stringify(record)}`);
          });
        }
      } catch (err) {
        console.log(`\nCould not get sample records: ${err.message}`);
      }
    }
    
    console.log('\n');
  };

  // Inspect key tables
  ['companies', 'contacts', 'deals'].forEach(tableName => {
    if (tables.find(t => t.name === tableName)) {
      inspectTable(tableName);
    }
  });

  // Check for data integrity: bi-directional sync validation
  console.log('🔗 Bi-directional Sync Validation');
  console.log('=' .repeat(50));
  
  try {
    // Find companies with contacts and check if their types match
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
      WHERE 
        c.type != cont.type 
        OR c.lead_status != cont.lead_status 
        OR c.lead_temperature != cont.lead_temperature
      LIMIT 10
    `;
    
    const mismatches = db.prepare(mismatchQuery).all();
    
    if (mismatches.length > 0) {
      console.log('⚠️  Found potential sync issues:');
      mismatches.forEach((mismatch, i) => {
        console.log(`\n${i + 1}. Company: ${mismatch.company_name} (ID: ${mismatch.company_id})`);
        console.log(`   Contact: ${mismatch.contact_name} (ID: ${mismatch.contact_id})`);
        console.log(`   Type mismatch: Company="${mismatch.company_type}" vs Contact="${mismatch.contact_type}"`);
        console.log(`   Lead Status: Company="${mismatch.company_lead_status}" vs Contact="${mismatch.contact_lead_status}"`);
        console.log(`   Lead Temp: Company="${mismatch.company_lead_temperature}" vs Contact="${mismatch.contact_lead_temperature}"`);
      });
    } else {
      console.log('✅ No sync mismatches found between companies and contacts');
    }
  } catch (err) {
    console.log(`❌ Error checking sync: ${err.message}`);
  }

  // Check lead field clearing when entity type changes
  console.log('\n🧹 Lead Field Clearing Validation');
  console.log('=' .repeat(50));
  
  try {
    // Find entities that are not 'lead' type but still have lead fields
    const leadFieldQuery = `
      SELECT 
        'company' as entity_type,
        id,
        name as entity_name,
        type,
        lead_status,
        lead_temperature,
        lead_source
      FROM companies
      WHERE type != 'lead' AND (
        lead_status IS NOT NULL 
        OR lead_temperature IS NOT NULL 
        OR lead_source IS NOT NULL
      )
      
      UNION ALL
      
      SELECT 
        'contact' as entity_type,
        id,
        first_name || ' ' || last_name as entity_name,
        type,
        lead_status,
        lead_temperature,
        lead_source
      FROM contacts
      WHERE type != 'lead' AND (
        lead_status IS NOT NULL 
        OR lead_temperature IS NOT NULL 
        OR lead_source IS NOT NULL
      )
      LIMIT 10
    `;
    
    const leadFieldIssues = db.prepare(leadFieldQuery).all();
    
    if (leadFieldIssues.length > 0) {
      console.log('⚠️  Found entities with lead fields but non-lead type:');
      leadFieldIssues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.entity_type}: ${issue.entity_name} (ID: ${issue.id})`);
        console.log(`   Type: "${issue.type}" (should be "lead" to have lead fields)`);
        console.log(`   Lead Status: "${issue.lead_status}"`);
        console.log(`   Lead Temperature: "${issue.lead_temperature}"`);
        console.log(`   Lead Source: "${issue.lead_source}"`);
      });
    } else {
      console.log('✅ No inappropriate lead fields found on non-lead entities');
    }
  } catch (err) {
    console.log(`❌ Error checking lead fields: ${err.message}`);
  }

  db.close();
  console.log('\n✅ Database inspection completed');

} catch (error) {
  console.error('❌ Error accessing database:', error.message);
  console.log('\nMake sure the database file exists at:', dbPath);
}