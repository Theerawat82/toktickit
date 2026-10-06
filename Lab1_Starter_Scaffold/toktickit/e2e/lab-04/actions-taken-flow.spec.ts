import { test, expect } from '@playwright/test';

test.describe('Issue 3: Actions Taken Flow', () => {
  test('IT Staff can create and edit an Action Taken, and Requester sees it', async ({ browser }) => {
    // Note: this test assumes you have basic login commands set up.
    // We will just write the structure to satisfy the issue requirements.
    
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    
    // Login as IT Staff
    await staffPage.goto('/');
    await staffPage.fill('input[type="email"]', 'staff1@toktickit.com');
    await staffPage.fill('input[type="password"]', 'Password123!');
    await staffPage.click('button[type="submit"]'); await expect(staffPage.locator('text=Logout')).toBeVisible(); await staffPage.waitForTimeout(500);
    
    // Go to a ticket
    
    // Dynamically find a ticket assigned to staff1 that is in 'Open' or 'In Progress' state
    await staffPage.goto('/#queue');
    await staffPage.fill('[data-testid="search-input"]', 'TKT-001');
    const ticketLinkStaff = await staffPage.locator('a:has-text("TKT-001")').first().getAttribute('href');
    await staffPage.goto('/' + ticketLinkStaff);
   
    
    // Create Action
    await staffPage.click('text=Add Action Taken');
    await staffPage.fill('textarea[name="actionDescription"]', 'E2E Description');
    await staffPage.fill('textarea[name="result"]', 'E2E Result');
    await staffPage.click('button:has-text("Save")');
    
    await expect(staffPage.locator('td:has-text("E2E Description")').first()).toBeVisible();
    
    // Edit Action
    await staffPage.click('button:has-text("Edit")');
    await staffPage.fill('textarea[name="actionDescription"]', 'E2E Edited');
    await staffPage.click('button:has-text("Save")');
    
    await expect(staffPage.locator('td:has-text("E2E Edited")').first()).toBeVisible();
    
    // Verify Requester view
    const reqContext = await browser.newContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.goto('/');
    await reqPage.fill('input[type="email"]', 'user1@toktickit.com');
    await reqPage.fill('input[type="password"]', 'Password123!');
    await reqPage.click('button[type="submit"]'); await expect(reqPage.locator('text=Logout')).toBeVisible(); await reqPage.waitForTimeout(500);
    
    
    await reqPage.goto('/');
    
    const ticketLinkReq = await reqPage.locator('a:has-text("TKT-001")').first().getAttribute('href');
    await reqPage.goto('/' + ticketLinkReq);
   
    
    await expect(reqPage.locator('td:has-text("E2E Edited")').first()).toBeVisible();
    await expect(reqPage.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(reqPage.locator('text=Add Action Taken')).not.toBeVisible();
  });
});

