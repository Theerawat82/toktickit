import { test, expect } from '@playwright/test';

test.describe('Issue 6: Regression Smoke', () => {
  test('Leftovers - mock-identity header returns 401', async ({ request }) => {
    const response = await request.get('/api/tickets', {
      headers: { 'mock-identity': '1' }
    });
    expect(response.status()).toBe(401);
  });

  test('Form Data Protection on Network Error (Issue 6, Phase 1) - Multiple Forms', async ({ page }) => {
    // Login as a requester
    await page.goto('/');
    await page.fill('input[type="email"]', 'req1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard
    await expect(page.locator('text=Logout')).toBeVisible();
    
    // ============================================
    // Form 1: Create Ticket
    // ============================================
    await page.goto('/#tickets/new');
    await page.fill('[data-testid="input-summary"]', 'My Network Will Fail');
    await page.fill('[data-testid="input-description"]', 'Some very long description that I do not want to lose.');
    
    // Intercept the API call and simulate a 500 error
    await page.route('/api/tickets', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
    });
    await page.click('button[type="submit"]');
    
    // Assert data is still there
    await expect(page.locator('[data-testid="input-summary"]')).toHaveValue('My Network Will Fail'); await page.unrouteAll({ behavior: 'ignoreErrors' });
    await expect(page.locator('[data-testid="input-description"]')).toHaveValue('Some very long description that I do not want to lose.');
    
    // Now simulate network failure (abort)
    await page.route('/api/tickets', async route => {
      await route.abort('failed');
    });
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="input-summary"]')).toHaveValue('My Network Will Fail'); await page.unrouteAll({ behavior: 'ignoreErrors' });

    // ============================================
    // Now login as IT Staff for Staff forms
    // ============================================
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Logout')).toBeVisible();

    // Go to first ticket
    await page.goto('/#queue');
    
    const ticketUrl = await page.locator('a[data-testid^="ticket-link-"]').first().getAttribute('href');
    await page.goto(`/${ticketUrl}`);
    await page.waitForSelector('h4'); // Wait for ticket details

    // ============================================
    // Form 2: Create Action
    // ============================================
    await page.click('button:has-text("Add Action Taken")');
    await page.fill('#actionDescription', 'This action will fail');
    await page.fill('#result', 'Failure');
    
    await page.route('**/actions', async route => route.abort('failed'));
    await page.click('button:has-text("Save")');
    await expect(page.locator('#actionDescription')).toHaveValue('This action will fail');
    await expect(page.locator('#result')).toHaveValue('Failure');
    await page.click('button:has-text("Cancel")'); await page.unrouteAll({ behavior: 'ignoreErrors' });

    // ============================================
    // Form 3: Edit Action
    // ============================================
    // Seed a real action via API so Edit is guaranteed
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const tId = ticketUrl!.match(/\d+/)?.[0];
    await page.request.post(`/api/tickets/${tId}/actions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { actionDescription: 'Seeded action for edit', result: 'Pending', followUpRequired: false }
    });
    await page.reload();
    await page.waitForSelector('button:has-text("Edit")');
    
    await page.locator('button:has-text("Edit")').first().click();
    await page.fill('#actionDescription', 'Editing action will fail');
    await page.route('**/actions/**', async route => route.abort('failed'));
    await page.click('button:has-text("Save")');
    await expect(page.locator('#actionDescription')).toHaveValue('Editing action will fail');
    await page.click('button:has-text("Cancel")'); await page.unrouteAll({ behavior: 'ignoreErrors' });

    // ============================================
    // Form 4: Public Comment
    // ============================================
    await page.fill('textarea[placeholder^="Write a public comment"]', 'This comment will fail');
    await page.route('**/comments', async route => route.abort('failed'));
    await page.click('button:has-text("Post Comment")');
    await expect(page.locator('textarea[placeholder^="Write a public comment"]')).toHaveValue('This comment will fail'); await page.unrouteAll({ behavior: 'ignoreErrors' });

    // ============================================
    // Form 5: Internal Note
    // ============================================
    await page.click('text=Internal Notes');
    await page.fill('textarea[placeholder^="Write an internal note"]', 'This note will fail');
    await page.route('**/internal-notes', async route => route.abort('failed'));
    await page.click('button:has-text("Add Internal Note")');
    await expect(page.locator('textarea[placeholder^="Write an internal note"]')).toHaveValue('This note will fail'); await page.unrouteAll({ behavior: 'ignoreErrors' });

    // ============================================
    // Admin login for Admin Forms
    // ============================================
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Logout')).toBeVisible();

    // ============================================
    // Form 6: Admin User Create/Edit
    // ============================================
    await page.goto('/#admin/users');
    await page.click('button:has-text("+ Create User")');
    await page.fill('#userName', 'Failing User');
    await page.fill('#userEmail', 'fail@example.com');
    await page.route('**/users', async route => route.abort('failed'));
    await page.click('button:has-text("Save User")');
    await expect(page.locator('#userName')).toHaveValue('Failing User');
  });
});
