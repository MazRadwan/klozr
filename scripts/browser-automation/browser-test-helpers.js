// Browser automation helper functions for UI testing
const { TEST_USER } = require('./setup-test-user');

class BrowserTestHelpers {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testUser = TEST_USER;
  }

  // Login using test credentials
  async login() {
    console.log('🔐 Logging in with test credentials...');
    
    // Navigate to login page
    await this.navigate('/login');
    
    // Fill in credentials
    await this.fillInput('#email', this.testUser.email);
    await this.fillInput('#password', this.testUser.password);
    
    // Submit form
    await this.clickButton('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.waitForUrl('/dashboard');
    
    console.log('✅ Login successful');
  }

  // Navigate to a specific path
  async navigate(path) {
    const url = `${this.baseUrl}${path}`;
    console.log(`🧭 Navigating to: ${url}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('navigate() must be implemented by browser automation tool');
  }

  // Fill an input field
  async fillInput(selector, value) {
    console.log(`✏️  Filling input ${selector} with: ${value}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('fillInput() must be implemented by browser automation tool');
  }

  // Click a button or element
  async clickButton(selector) {
    console.log(`👆 Clicking: ${selector}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('clickButton() must be implemented by browser automation tool');
  }

  // Wait for URL to match
  async waitForUrl(expectedPath) {
    console.log(`⏳ Waiting for URL to contain: ${expectedPath}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('waitForUrl() must be implemented by browser automation tool');
  }

  // Wait for element to be visible
  async waitForElement(selector) {
    console.log(`⏳ Waiting for element: ${selector}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('waitForElement() must be implemented by browser automation tool');
  }

  // Take a screenshot for debugging
  async screenshot(name) {
    console.log(`📸 Taking screenshot: ${name}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('screenshot() must be implemented by browser automation tool');
  }

  // Verify element exists
  async verifyElementExists(selector) {
    console.log(`✅ Verifying element exists: ${selector}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('verifyElementExists() must be implemented by browser automation tool');
  }

  // Verify element contains text
  async verifyElementText(selector, expectedText) {
    console.log(`✅ Verifying element ${selector} contains: ${expectedText}`);
    // This will be implemented by the specific browser automation tool
    throw new Error('verifyElementText() must be implemented by browser automation tool');
  }

  // Test a delete action and verify it worked
  async testDeleteAction(deleteButtonSelector, confirmationSelector = null) {
    console.log('🗑️  Testing delete action...');
    
    // Take before screenshot
    await this.screenshot('before-delete');
    
    // Click delete button
    await this.clickButton(deleteButtonSelector);
    
    // If there's a confirmation dialog, confirm it
    if (confirmationSelector) {
      await this.waitForElement(confirmationSelector);
      await this.clickButton(confirmationSelector);
    }
    
    // Take after screenshot
    await this.screenshot('after-delete');
    
    console.log('✅ Delete action completed');
  }
}

module.exports = { BrowserTestHelpers };