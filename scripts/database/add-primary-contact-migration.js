#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Path to your database file
const dbPath = path.join(__dirname, '..', 'db.sqlite');

try {
  const db = new Database(dbPath);
  
  console.log('Adding is_primary column to contacts table...');
  
  // Add the is_primary column with default value false
  db.exec(`
    ALTER TABLE contacts 
    ADD COLUMN is_primary INTEGER DEFAULT 0;
  `);
  
  console.log('✅ Successfully added is_primary column to contacts table');
  
  // Optional: Set the first contact for each company as primary
  console.log('Setting first contact per company as primary...');
  
  db.exec(`
    UPDATE contacts 
    SET is_primary = 1 
    WHERE id IN (
      SELECT MIN(id) 
      FROM contacts 
      WHERE company_id IS NOT NULL 
      GROUP BY company_id
    );
  `);
  
  console.log('✅ Successfully set primary contacts for existing companies');
  
  db.close();
  console.log('🎉 Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} 