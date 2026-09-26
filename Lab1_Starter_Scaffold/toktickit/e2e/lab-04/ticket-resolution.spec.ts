import { test, expect } from '@playwright/test';

test.describe('Issue 4: Ticket Resolution Flow', () => {
  test('BR-06: Reject resolution without actions, then succeed with actions, then requester confirms', async ({ browser }) => {
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    
    // Login as IT Staff
    await staffPage.goto('/login');
    await staffPage.fill('input[type="email"]', 'staff1@toktickit.com');
    await staffPage.fill('input[type="password"]', 'Password123!');
    await staffPage.click('button[type="submit"]');
    
    await staffPage.locator('a[data-testid^="ticket-link-"]').first().click(); 
    
    // Switch to Service Actions tab if needed (depends on UI)
    const hasServiceActionsTab = await staffPage.locator('text=Service Actions').isVisible();
    if (hasServiceActionsTab) {
      await staffPage.click('text=Service Actions');
    }
    
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
    
    // Switch back to Service Actions tab if needed
    if (hasServiceActionsTab) {
      await staffPage.click('text=Service Actions');
    }
    
    // Attempt Resolved again
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Resolved');
    // Ensure success (error goes away, status updates)
    await expect(staffPage.locator('select[aria-label="Current Status"]')).toHaveValue('Resolved');
    
    // Login as Requester
    const reqContext = await browser.newContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.goto('/login');
    await reqPage.fill('input[type="email"]', 'user1@toktickit.com');
    await reqPage.fill('input[type="password"]', 'Password123!');
    await reqPage.click('button[type="submit"]');
    
    await reqPage.locator('a[data-testid^="ticket-link-"]').first().click(); 
    
    // Verify status is Resolved but Requester can't change it
    await expect(reqPage.locator('text=Resolved')).toBeVisible();
    await expect(reqPage.locator('select[aria-label="Current Status"]')).not.toBeVisible();
    
    // Click confirm resolved
    await reqPage.click('text=Confirm this is resolved');
    
    // Verify confirmation message and unchanged status
    await expect(reqPage.locator('text=You confirmed this resolution — IT Staff will do a final review')).toBeVisible();
    await expect(reqPage.locator('text=Confirm this is resolved')).not.toBeVisible();
    
    // Back to IT Staff -> Transition to Closed
    await staffPage.selectOption('select[aria-label="Current Status"]', 'Closed');
    await expect(staffPage.locator('select[aria-label="Current Status"]')).toHaveValue('Closed');
    
    // Requester view shows Closed
    await reqPage.reload();
    await expect(reqPage.locator('text=Closed')).toBeVisible();
  });
});
