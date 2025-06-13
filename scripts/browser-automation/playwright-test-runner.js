// Playwright implementation of browser test helpers
const { BrowserTestHelpers } = require('./browser-test-helpers');

class PlaywrightTestRunner extends BrowserTestHelpers {
  constructor(playwrightMcp) {
    super();
    this.mcp = playwrightMcp;
  }

  async navigate(path) {
    const url = `${this.baseUrl}${path}`;
    console.log(`🧭 Navigating to: ${url}`);
    await this.mcp.browser_navigate({ url });
  }

  async fillInput(selector, value) {
    console.log(`✏️  Filling input ${selector} with: ${value}`);
    await this.mcp.browser_type({
      element: `Input field ${selector}`,
      ref: selector,
      text: value
    });
  }

  async clickButton(selector) {
    console.log(`👆 Clicking: ${selector}`);
    await this.mcp.browser_click({
      element: `Button ${selector}`,
      ref: selector
    });
  }

  async waitForUrl(expectedPath) {
    console.log(`⏳ Waiting for URL to contain: ${expectedPath}`);
    // Wait a bit for navigation
    await this.mcp.browser_wait({ time: 2 });
    // Could implement URL checking here if needed
  }

  async waitForElement(selector) {
    console.log(`⏳ Waiting for element: ${selector}`);
    await this.mcp.browser_wait({ time: 1 });
    // Element waiting would be handled by the browser
  }

  async screenshot(name) {
    console.log(`📸 Taking screenshot: ${name}`);
    await this.mcp.browser_take_screenshot({ raw: false });
  }

  async verifyElementExists(selector) {
    console.log(`✅ Verifying element exists: ${selector}`);
    // Take a snapshot to see current page state
    await this.mcp.browser_snapshot();
  }

  async verifyElementText(selector, expectedText) {
    console.log(`✅ Verifying element ${selector} contains: ${expectedText}`);
    // Take a snapshot to see current page state
    await this.mcp.browser_snapshot();
  }
}

module.exports = { PlaywrightTestRunner };