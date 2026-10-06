import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Issue 4: Ticket Resolution Flow', () => {
  test.beforeAll(() => {
    execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  });
  test('BR-08: Reject resolution without actions, then succeed with actions, then requester confirms', async ({ browser }) => {
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    
    // Login as IT Staff
    await staffPage.goto('/login');
    await staffPage.fill('input[type="email"]', 'staff1@toktickit.com');
    await staffPage.fill('input[type="password"]', 'Password123!');
    await staffPage.click('button[type="submit"]'); await expect(staffPage.locator('text=Logout')).toBeVisible(); await staffPage.waitForTimeout(500);
    
    await staffPage.goto('/#queue'); await staffPage.fill('[data-testid="search-input"]', 'TKT-108');
    const ticketLinkResStaff = await staffPage.locator('a:has-text("TKT-108")').first().getAttribute('href');
    await staffPage.goto('/' + ticketLinkResStaff);
    
    // Switch to Service Actions tab
    await staffPage.click('button:has-text("Service Actions")');
    
    // Transition to Open first (since TKT-108 is New)
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Open');
    
    // Transition to In Progress
    await staffPage.selectOption('select[aria-label="Current Status"]', 'In Progress');
    
    // Attempt to transition to Resolved WITHOUT Actions
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Resolved');
    await expect(staffPage.locator('text=Cannot resolve a ticket without at least one Action Taken recorded')).toBeVisible();
    
    // Add Action Taken
    await staffPage.click('text=Add Action Taken');
    await staffPage.fill('textarea[name="actionDescription"]', 'E2E Description');
    await staffPage.fill('textarea[name="result"]', 'E2E Result');
    await staffPage.click('button:has-text("Save")');
    await expect(staffPage.locator('text=E2E Description')).toBeVisible();
    
    // Switch back to Service Actions tab
    await staffPage.click('button:has-text("Service Actions")');
    
    // Attempt Resolved again
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Resolved');
    // Ensure success (error goes away, status updates)
    await expect(staffPage.locator('select[aria-label="Current Status"]')).toHaveValue('Resolved');
    
    // Login as Requester
    const reqContext = await browser.newContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.goto('/login');
    await reqPage.fill('input[type="email"]', 'req1@toktickit.com');
    await reqPage.fill('input[type="password"]', 'Password123!');
    await reqPage.click('button[type="submit"]'); await expect(reqPage.locator('text=Logout')).toBeVisible(); await reqPage.waitForTimeout(500);
    
    await reqPage.goto('/');
    const ticketLinkResReq = await reqPage.locator('a:has-text("TKT-108")').first().getAttribute('href');
    await reqPage.goto('/' + ticketLinkResReq);
    
    // Verify status is Resolved but Requester can't change it
    await expect(reqPage.getByText('Resolved', { exact: true }).first()).toBeVisible();
    await expect(reqPage.locator('select[aria-label="Current Status"]')).not.toBeVisible();
    
    // Click confirm resolved
    await reqPage.click('text=Confirm this is resolved');
    
    // Verify confirmation message and unchanged status
    await expect(reqPage.locator('text=You confirmed this resolution')).toBeVisible();
    await expect(reqPage.locator('text=Confirm this is resolved')).not.toBeVisible();
    
    // Back to IT Staff -> Transition to Closed
    await staffPage.click('text=Back to Ticket Queue');
    await expect(staffPage.locator('[data-testid="search-input"]')).toBeVisible();
    await staffPage.goto('/' + ticketLinkResStaff);
    await expect(staffPage.locator('button:has-text("Service Actions")')).toBeVisible();
    await staffPage.click('button:has-text("Service Actions")');
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Closed');
    await expect(staffPage.locator('select[aria-label="Current Status"]')).toHaveValue('Closed');
    
    // Requester view shows Closed
    await reqPage.reload();
    await expect(reqPage.getByText('Closed', { exact: true }).first()).toBeVisible();
  });
});
