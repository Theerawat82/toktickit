import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Development Requester Context', () => {
  test('should load page, select a requester, and save context', async ({ page }) => {
    // Mock the backend requests so the test passes without a running server/DB
    await page.route('**/api/health', route => route.fulfill({
      status: 200,
      json: { service: 'TokTickIT API', status: 'pass' }
    }));
    await page.route('**/api/categories', route => route.fulfill({
      status: 200,
      json: [{ id: 1, name: 'Account and Access' }]
    }));
    await page.route('**/api/requesters', route => route.fulfill({
      status: 200,
      json: [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', isActive: true },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', isActive: true }
      ]
    }));

    // Navigate to the app (adjust URL if dev server runs elsewhere)
    await page.goto('http://localhost:5173');

    // Wait for the dropdown to be visible (indicates loading finished)
    const dropdown = page.getByTestId('requester-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10000 });

    // Select the first available actual requester (index 1 since 0 is disabled placeholder)
    // We can also just select by checking the options
    await dropdown.selectOption({ index: 1 });

    // Click continue
    const continueBtn = page.getByTestId('continue-btn');
    await expect(continueBtn).not.toBeDisabled();
    await continueBtn.click();

    // Assert that the saved message appears
    const savedMessage = page.getByTestId('saved-message');
    await expect(savedMessage).toBeVisible();
    await expect(savedMessage).toContainText('saved to development context');

    // Capture screenshot
    const screenshotDir = path.resolve(__dirname, '../../artifacts/lab-02/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotDir, 'requester-selection-success.png'), fullPage: true });

    // Verify localStorage
    const savedId = await page.evaluate(() => localStorage.getItem('dev_requester_id'));
    expect(savedId).toBeTruthy();
  });
});
