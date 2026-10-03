import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.use({ viewport: { width: 1280, height: 720 } });

test('Capture Submission Screenshots', async ({ page }) => {
  // 1. Requester Flow
  await page.goto('http://localhost:5174/#login');
  await page.fill('input[type="email"]', 'req1@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button:has-text("Log In")');
  await page.waitForSelector('text=Logout'); // Ensure logged in
  
  await page.goto('http://localhost:5174/#dashboard');
  await page.waitForTimeout(1000); // Wait for loading
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/requester-dashboard.png' });
  
  await page.goto('http://localhost:5174/#create');
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
  
  await page.goto('http://localhost:5174/#dashboard');
  await page.waitForTimeout(1000); // Wait for loading
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-dashboard.png' });
  
  await page.goto('http://localhost:5174/#queue');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-ticket-queue.png' });
  
  // Create INDEX.md
  const indexContent = `
# Submission Screenshots

| View | Screenshot File | Description |
|------|-----------------|-------------|
| Requester Dashboard | ![Requester Dashboard](./requester-dashboard.png) | Shows Zen Green themed dashboard for requesters |
| Create Ticket | ![Create Ticket](./create-ticket.png) | Shows themed create ticket form |
| Staff Dashboard | ![Staff Dashboard](./staff-dashboard.png) | Shows Zen Green themed dashboard for IT Staff |
| Staff Ticket Queue | ![Staff Ticket Queue](./staff-ticket-queue.png) | Shows themed staff queue with Status and Priority badges |
`;
  
  const outPath = path.resolve('artifacts/lab-04/screenshots/INDEX.md');
  fs.writeFileSync(outPath, indexContent.trim());
});
