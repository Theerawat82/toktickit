import { test, expect } from '@playwright/test';

test.describe('Issue 6: XSS and Navigation Crawl (3D & 3F)', () => {
  test('XSS Payload in Action Description renders as plain text', async ({ page, browser }) => {
    // We will bypass UI to seed the XSS directly via API to ensure it hits the DB as raw text
    // Then we load the UI and assert it did NOT execute and IS present as text.
    
    await page.goto('/');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await page.click('a:has-text("Dashboard")');
    await page.waitForURL(/.*#dashboard/);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    // Find first ticket
    await page.goto('/#queue');
    
    const ticketUrl = await page.getAttribute('a[data-testid^="ticket-link-"]', 'href');
    const tId = ticketUrl!.match(/\d+/)?.[0];

    const xssPayload = "<script>alert('XSS_VULN')</script>";

    // Post it via API
    await page.request.post(`/api/tickets/${tId}/actions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { actionDescription: xssPayload, result: 'Done', followUpRequired: false }
    });

    // Setup dialog listener to fail if alert pops up
    let alertPopped = false;
    page.on('dialog', async dialog => {
      alertPopped = true;
      await dialog.dismiss();
    });

    // Go to ticket detail
    await page.goto(`/${ticketUrl}`);
    await page.waitForSelector('text=Actions Taken');

    // It should render exactly as plain text
    await expect(page.locator(`text=${xssPayload}`)).toBeVisible();
    expect(alertPopped).toBe(false);
  });

  test('E2E Crawl for IT Staff - No 404s, Blank Pages, or Console Errors', async ({ page }) => {
    let consoleErrors = 0;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // ignore favicon or certain net errors if we want, but let's strictly count
        if(!msg.text().includes('favicon')) {
          consoleErrors++;
        }
      }
    });

    await page.goto('/');
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await page.click('a:has-text("Dashboard")');
    await page.waitForURL(/.*#dashboard/);

    // Crawl Dashboard
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();

    // Crawl Queue
    await page.goto('/#queue');
    await expect(page.locator('text=Ticket Queue')).toBeVisible();

    // Crawl Search
    await page.goto('/#search');
    await expect(page.locator('text=Ticket Queue')).toBeVisible();
    
    // No console errors should have occurred
    expect(consoleErrors).toBe(0);
  });
});
