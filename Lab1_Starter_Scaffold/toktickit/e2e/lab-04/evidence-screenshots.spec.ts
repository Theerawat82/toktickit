import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

test('Capture Submission Screenshots', async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    
    // 1. Requester Flow
    await page.goto('/#login');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Log In")');
    await page.waitForSelector('text=Logout'); // Ensure logged in
    
    await page.goto('/#dashboard');
    await page.waitForTimeout(1000);
    // Use desktop suffix if not desktop, or just follow the same pattern
    let suffix = vp.name === 'desktop' ? '' : '-' + vp.name;
    await page.screenshot({ path: 'artifacts/lab-04/screenshots/requester-dashboard' + suffix + '.png', fullPage: true });
    
    await page.goto('/#create');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/lab-04/screenshots/create-ticket' + suffix + '.png', fullPage: true });
    
    // Logout
    await page.click('text=Logout');
    await page.waitForSelector('text=Log In to TokTickIT');
    
    // 2. Staff Flow
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Log In")');
    await page.waitForSelector('text=Logout');
    
    await page.goto('/#dashboard');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-dashboard' + suffix + '.png', fullPage: true });
    
    await page.goto('/#queue');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/lab-04/screenshots/staff-ticket-queue' + suffix + '.png', fullPage: true });
    
    // Logout
    await page.click('text=Logout');
    await page.waitForSelector('text=Log In to TokTickIT');
  }
});
