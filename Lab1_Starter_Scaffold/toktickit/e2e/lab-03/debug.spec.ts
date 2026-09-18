import { test, expect } from '@playwright/test';

test('debug: check role value after login', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.startsWith('ROLE_DEBUG:')) {
      messages.push(text);
      console.log('BROWSER:', text);
    }
  });
  
  await page.goto('/');
  await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  
  // Inject a MutationObserver to log when the role display changes
  await page.evaluate(() => {
    // Poll every 500ms to check the role text
    const interval = setInterval(() => {
      const roleEl = document.querySelector('.small.text-muted.mb-2');
      const html = document.body.innerHTML;
      const hasStaffQueue = html.includes('data-testid="staff-queue"');
      const hasMyTickets = html.includes('My Tickets');
      const roleText = roleEl?.textContent || 'null';
      const roleBytes = Array.from(roleText).map((c: any) => c.charCodeAt(0)).join(',');
      console.log(`ROLE_DEBUG: role="${roleText}" bytes=[${roleBytes}] hasStaffQueue=${hasStaffQueue} hasMyTickets=${hasMyTickets}`);
    }, 500);
    (window as any).__debugInterval = interval;
  });
  
  await page.fill('input[type="email"]', 'staff1@toktickit.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Wait 8 seconds observing
  await page.waitForTimeout(8000);
  
  await page.evaluate(() => clearInterval((window as any).__debugInterval));
  
  console.log('All role debug messages:', messages);
});
