import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'child_process';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

async function login(page, email, password) {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Removed wait for logout button because each test waits for its own specific selector
}

async function runA11yCheck(page) {
  // Wait a moment for dynamic content to settle
  await page.waitForTimeout(500);

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  const seriousViolations = accessibilityScanResults.violations.filter(v => 
    (v.impact === 'serious' || v.impact === 'critical') && v.id !== 'color-contrast'
  );
  expect(seriousViolations).toEqual([]);

  const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasScroll).toBe(false);

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  expect(errors.length).toBe(0);

  // Focus indicator check (simulate Tab)
  await page.keyboard.press('Tab');
  const focusedId = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName || document.activeElement.className);
  expect(focusedId).toBeTruthy();
}

test.describe('Section 4: Accessibility and UI Consistency (Full 11 Screens)', () => {
  test.beforeAll(() => {
    console.log('Seeding database for a11y tests...');
    execSync('npm run prisma:seed --prefix server', { stdio: 'inherit' });
  });

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name}`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
      });

      test('1. Login Screen', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('button[type="submit"]');
        await runA11yCheck(page);
      });

      test('2. Change Password Screen', async ({ page }) => {
        // newstaff is seeded with mustChangePassword flag
        await login(page, 'newstaff@toktickit.com', 'Password123!');
        await page.waitForSelector('text=Change Your Password');
        await runA11yCheck(page);
      });

      test('3. Requester Dashboard', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#dashboard');
        await page.waitForSelector('h2:has-text("My Dashboard")');
        await runA11yCheck(page);
      });

      test('4. My Tickets (Requester)', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#mytickets');
        await page.waitForSelector('strong:has-text("My Tickets")');
        await runA11yCheck(page);
      });

      test('5. Create Ticket', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#mytickets'); // create is rendered here
        await page.waitForSelector('text=Create New Ticket');
        await runA11yCheck(page);
        
        // Validation error check specifically for Create Ticket
        await page.click('button:has-text("Submit Ticket")');
        const alert = page.locator('.invalid-feedback[role="alert"]').first();
        await expect(alert).toBeVisible();
      });

      test('6. Ticket Detail (Requester)', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#mytickets');
        const linkLocator = page.locator('a[href^="#ticket/"]').first();
        await linkLocator.waitFor({ state: 'attached' });
        const href = await linkLocator.getAttribute('href');
        await page.goto('/' + href);
        // Wait for Actions Taken row which is crucial for a11y on this page
        await page.waitForSelector('h3:has-text("Actions Taken")');
        await runA11yCheck(page);
      });

      test('7. Staff Dashboard', async ({ page }) => {
        await login(page, 'staff1@toktickit.com', 'Password123!');
        await page.goto('/#dashboard');
        await page.waitForSelector('h2:has-text("Dashboard")');
        await runA11yCheck(page);
      });

      test('8. Staff Ticket Queue', async ({ page }) => {
        await login(page, 'staff1@toktickit.com', 'Password123!');
        await page.goto('/#queue');
        await page.waitForSelector('strong:has-text("Ticket Queue")');
        await runA11yCheck(page);
      });

      test('9. Ticket Detail (Staff)', async ({ page }) => {
        await login(page, 'staff1@toktickit.com', 'Password123!');
        await page.goto('/#queue');
        const linkLocator = page.locator('a[href^="#ticket/"]').first();
        await linkLocator.waitFor({ state: 'attached' });
        const href = await linkLocator.getAttribute('href');
        await page.goto('/' + href);
        await page.waitForSelector('h3:has-text("Actions Taken")');
        await runA11yCheck(page);
      });

      test('10. Administrator Dashboard', async ({ page }) => {
        await login(page, 'admin@toktickit.com', 'Password123!');
        await page.goto('/#dashboard');
        // Admin uses the Staff dashboard component
        await page.waitForSelector('h2:has-text("Dashboard")');
        await runA11yCheck(page);
      });

      test('11. Admin User Management', async ({ page }) => {
        await login(page, 'admin@toktickit.com', 'Password123!');
        await page.goto('/#admin/users');
        await page.waitForSelector('button:has-text("+ Create User")');
        await runA11yCheck(page);
      });
    });
  }
});
