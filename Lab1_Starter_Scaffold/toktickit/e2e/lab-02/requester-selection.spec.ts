import { test, expect } from '@playwright/test';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';

const MOCK_REQUESTERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', isActive: true },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', isActive: true },
];

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
    // Match both /api/requesters and /api/requesters?active=true
    await page.route('**/api/requesters**', route => route.fulfill({
      status: 200,
      json: MOCK_REQUESTERS,
    }));

    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for the RequesterSelector dropdown to be visible (loading finished)
    const dropdown = page.getByTestId('requester-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10000 });

    // Select the first requester option (index 1 since 0 is the disabled placeholder)
    await dropdown.selectOption({ index: 1 });

    // After selection, the active-requester-badge should appear (auto-save via context)
    const badge = page.getByTestId('active-requester-badge');
    await expect(badge).toBeVisible({ timeout: 5000 });
    await expect(badge).toContainText('Alice Johnson');

    // Verify localStorage was updated
    const savedId = await page.evaluate(() => localStorage.getItem('dev_requester_id'));
    expect(savedId).toBe('1');

    // Capture full-page screenshot
    const screenshotDir = path.resolve('artifacts/lab-02/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({
      path: path.join(screenshotDir, 'requester-selection-success.png'),
      fullPage: true,
    });
  });
});
