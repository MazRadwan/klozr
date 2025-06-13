# Browser Automation Testing

This folder contains scripts for automated UI testing using Playwright and Puppeteer MCPs.

## Setup

### 1. Create Test User
```bash
node browser-automation/setup-test-user.js
```
Creates test user with credentials:
- Email: `test@automation.local` 
- Password: `TestPassword123!`

### 2. Enable Testing Mode (Optional)
Set environment variable to bypass authentication:
```bash
export TESTING_MODE=true
```

## Usage

### Playwright Testing
Use the Playwright MCP tools for browser automation:

```javascript
// Example: Login and test UI
await mcp.browser_navigate({ url: "http://localhost:3000/login" });
await mcp.browser_type({ element: "Email", ref: "selector", text: "test@automation.local" });
await mcp.browser_type({ element: "Password", ref: "selector", text: "TestPassword123!" });
await mcp.browser_click({ element: "Sign In", ref: "selector" });
```

### Test Helpers
- `browser-test-helpers.js` - Base class with common testing methods
- `playwright-test-runner.js` - Playwright-specific implementation

## Common Testing Patterns

### Test Delete Actions
```javascript
const tester = new PlaywrightTestRunner(mcp);
await tester.login();
await tester.testDeleteAction('.delete-button', '.confirm-button');
```

### Verify UI Changes
```javascript
await tester.screenshot('before-action');
await tester.clickButton('.some-button');
await tester.screenshot('after-action');
await tester.verifyElementExists('.success-message');
```

## Tips
- Always start with `tester.login()` for authenticated pages
- Use screenshots to debug UI issues
- Test both success and error cases
- Verify no side effects after actions