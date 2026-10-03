import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('Capture Submission Screenshots', async ({ page }) => {
  // 1. Requester Flow
  await page.goto('/#login');
  await page.fill('input[type="email"]', 'req1@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button:has-text("Log In")');
  await page.waitForSelector('text=Logout'); // Ensure logged in
  
  await page.goto('/#dashboard');
  await page.waitForTimeout(1000); // Wait for loading
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/requester-dashboard.png' });
  
  await page.goto('/#create');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/create-ticket.png' });
  
  // Logout
  await page.click('text=Logout');
  await page.waitForSelector('text=Log In to TokTickIT');
  
  // 2. Staff Flow
  await page.fill('input[type="email"]', 'staff1@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button:has-text("Log In")');
  await page.waitForSelector('text=Logout');
  
  await page.goto('/#dashboard');
  await page.waitForTimeout(1000); // Wait for loading
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-dashboard.png' });
  
  await page.goto('/#queue');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-ticket-queue.png' });
});
