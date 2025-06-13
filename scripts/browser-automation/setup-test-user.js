// Setup test user for browser automation
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Connect to database
const db = new Database('db.sqlite');

const TEST_USER = {
  email: 'test@automation.local',
  password: 'TestPassword123!',
  username: 'Test User'
};

async function setupTestUser() {
  try {
    console.log('Setting up test user for browser automation...');
    
    // Check if test user already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(TEST_USER.email);
    
    if (existing) {
      console.log('Test user already exists, updating password...');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, username = ?, is_active = ? 
        WHERE email = ?
      `).run(hashedPassword, TEST_USER.username, 1, TEST_USER.email);
    } else {
      console.log('Creating new test user...');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      db.prepare(`
        INSERT INTO users (email, password_hash, username, is_active)
        VALUES (?, ?, ?, ?)
      `).run(TEST_USER.email, hashedPassword, TEST_USER.username, 1);
    }
    
    console.log('✅ Test user setup complete!');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    
    db.close();
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestUser();
}

module.exports = { TEST_USER, setupTestUser };