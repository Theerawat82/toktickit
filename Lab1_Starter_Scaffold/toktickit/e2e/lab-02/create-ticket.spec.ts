import { test, expect } from '@playwright/test';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';

test.describe('Create Ticket Flow', () => {
  test('should allow a requester to fill out and submit a ticket successfully', async ({ page }) => {
    // 1. Mock Reference Data
    await page.route('**/api/health', route => route.fulfill({
      status: 200, json: { service: 'TokTickIT API', status: 'pass' }
    }));
    await page.route('**/api/categories', route => route.fulfill({
      status: 200, json: [{ id: 1, name: 'Account and Access' }]
    }));
    await page.route('**/api/related-systems', route => route.fulfill({
      status: 200, json: [{ id: 1, name: 'ERP System' }]
    }));
    await page.route('**/api/requesters**', route => route.fulfill({
      status: 200, json: [{ id: 1, name: 'Alice Johnson', email: 'alice@example.com', isActive: true }]
    }));

    // 2. Mock Create Ticket API
    await page.route('**/api/tickets', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          json: { id: 1, ticketNumber: 'TIK-00001', currentStatus: 'New' }
        });
      } else {
        route.continue();
      }
    });

    // 3. Navigate to App
    await page.goto('http://localhost:5173');

    // 4. Select Requester (this reveals the Create Ticket form)
    const dropdown = page.getByTestId('requester-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.selectOption({ index: 1 });

    // Wait for the Create Ticket form to appear
    const createForm = page.getByTestId('create-ticket-form');
    await expect(createForm).toBeVisible();

    // 5. Fill out the form
    await page.getByTestId('input-summary').fill('Cannot access the ERP system');
    await page.getByTestId('input-description').fill('I am getting an invalid password error when trying to log in.');

    // Wait for reference dropdowns to populate, then select
    const categorySelect = page.getByTestId('select-category');
    await categorySelect.selectOption({ index: 1 });

    const systemSelect = page.getByTestId('select-system');
    await systemSelect.selectOption({ index: 1 });

    const prioritySelect = page.getByTestId('select-priority');
    await prioritySelect.selectOption('High');

    // 6. Submit the form
    await page.getByTestId('submit-ticket-btn').click();

    // 7. Verify Success
    const successBanner = page.getByTestId('success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('TIK-00001');

    // 8. Capture Screenshot
    const screenshotDir = path.resolve('artifacts/lab-02/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({
      path: path.join(screenshotDir, 'create-ticket-success.png'),
      fullPage: true,
    });
  });
});
