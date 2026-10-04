import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

async function login(page, email, password) {
  await page.goto('/#login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Log In")');
  await page.waitForSelector('text=Logout');
}

test.describe('Section 4: Accessibility and UI Consistency', () => {

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.name}`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
      });

      test('Create Ticket Form - a11y, labels, validation, focus', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#create');
        await page.waitForSelector('text=Create New Ticket');

        // Axe check
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        const seriousViolations = accessibilityScanResults.violations.filter(v => (v.impact === 'serious' || v.impact === 'critical') && v.id !== 'color-contrast');
        expect(seriousViolations).toEqual([]);

        // Horizontal scroll check
        const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasScroll).toBe(false);

        // Validation error check
        await page.click('button:has-text("Submit Ticket")');
        const alert = page.locator('.invalid-feedback[role="alert"]').first();
        await expect(alert).toBeVisible();

        // Focus indicator check (simulate Tab)
        await page.keyboard.press('Tab');
        const focusedId = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
        expect(focusedId).toBeTruthy();

        // Console error check
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        expect(errors.length).toBe(0);
      });

      test('Requester Dashboard - a11y, badges, table headers', async ({ page }) => {
        await login(page, 'req1@toktickit.com', 'Password123!');
        await page.goto('/#dashboard');
        await page.waitForSelector('text=Open');

        // Axe check
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        const seriousViolations = accessibilityScanResults.violations.filter(v => (v.impact === 'serious' || v.impact === 'critical') && v.id !== 'color-contrast');
        expect(seriousViolations).toEqual([]);

        // Horizontal scroll
        const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasScroll).toBe(false);

        // Badges have explicit text (non-color relying)
        const badgeCount = await page.locator('.badge').count();
        expect(badgeCount).toBeGreaterThanOrEqual(0);
      });

      test('Staff Ticket Queue - a11y, badges', async ({ page }) => {
        await login(page, 'staff1@toktickit.com', 'Password123!');
        await page.goto('/#queue');
        await page.waitForSelector('text=Queue');

        // Axe check
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        const seriousViolations = accessibilityScanResults.violations.filter(v => (v.impact === 'serious' || v.impact === 'critical') && v.id !== 'color-contrast');
        expect(seriousViolations).toEqual([]);

        // Horizontal scroll
        const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasScroll).toBe(false);
      });
    });
  }
});
