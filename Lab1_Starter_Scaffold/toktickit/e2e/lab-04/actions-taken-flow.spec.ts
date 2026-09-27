import { test, expect } from '@playwright/test';

test.describe('Issue 3: Actions Taken Flow', () => {
  test('IT Staff can create and edit an Action Taken, and Requester sees it', async ({ browser }) => {
    // Note: this test assumes you have basic login commands set up.
    // We will just write the structure to satisfy the issue requirements.
    
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    
    // Login as IT Staff
    await staffPage.goto('/login');
    await staffPage.fill('input[type="email"]', 'staff1@toktickit.com');
    await staffPage.fill('input[type="password"]', 'Password123!');
    await staffPage.click('button[type="submit"]');
    
    // Go to a ticket
    await staffPage.click('text=TKT-'); 
    
    // Create Action
    await staffPage.click('text=Add Action Taken');
    await staffPage.fill('textarea:has-text("Action Description")', 'E2E Description');
    await staffPage.fill('textarea:has-text("Result")', 'E2E Result');
    await staffPage.click('button:has-text("Save")');
    
    await expect(staffPage.locator('text=E2E Description')).toBeVisible();
    
    // Edit Action
    await staffPage.click('text=Edit');
    await staffPage.fill('textarea:has-text("Action Description")', 'E2E Edited');
    await staffPage.click('button:has-text("Save")');
    
    await expect(staffPage.locator('text=E2E Edited')).toBeVisible();
    
    // Verify Requester view
    const reqContext = await browser.newContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.goto('/login');
    await reqPage.fill('input[type="email"]', 'user1@toktickit.com');
    await reqPage.fill('input[type="password"]', 'Password123!');
    await reqPage.click('button[type="submit"]');
    
    await reqPage.click('text=TKT-'); 
    
    await expect(reqPage.locator('text=E2E Edited')).toBeVisible();
    await expect(reqPage.locator('text=Edit')).not.toBeVisible();
    await expect(reqPage.locator('text=Add Action Taken')).not.toBeVisible();
  });
});
