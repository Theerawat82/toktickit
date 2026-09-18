import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'child_process';

test.describe('Authentication & RBAC', () => {
  test.beforeAll(() => {
    // Ensure the database is cleanly seeded before test execution
    console.log('Seeding database...');
    execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Successful Login', async ({ page }) => {
    // Should show login form initially
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should render main app (Ticket Queue for Admin)
    await expect(page.locator('text=🎫 Ticket Queue')).toBeVisible();
    await expect(page.locator('text=Admin User').first()).toBeVisible();
  });

  test('Invalid Login Handling', async ({ page }) => {
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'WrongPassword!');
    await page.click('button[type="submit"]');

    // Should stay on login page and show generic error
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
    const errorMsg = page.locator('.alert-danger, [data-testid="error-message"], .error-message');
    await expect(errorMsg).toContainText(/Invalid email or password/i);
  });

  test('Inactive Account Access', async ({ page }) => {
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', 'inactive@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should stay on login page and show inactive account error
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
    const errorMsg = page.locator('.alert-danger, [data-testid="error-message"], .error-message');
    await expect(errorMsg).toContainText(/Account is inactive/i);
  });

  test('First-time Login & Forced Redirect (mustChangePassword) and Password Update Execution', async ({ page }) => {
    // 1. Log in with a first-time user account
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', 'newstaff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Confirm automatic redirection to Change Password view
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

    // 4. Submit the password change form with a valid new password
    await page.locator('input').nth(0).fill('Password123!');
    await page.locator('input').nth(1).fill('NewPassword123!');
    await page.locator('input').nth(2).fill('NewPassword123!');
    await page.click('button:has-text("Update Password")');

    // 5. Verify successful update and navigation to the main application shell
    await expect(page.locator('text=🎫 Ticket Queue')).toBeVisible();
    
    // Verify it sticks by reloading
    await page.reload();
    await expect(page.locator('text=🎫 Ticket Queue')).toBeVisible();
  });

  test('Logout & Session Invalidation', async ({ page }) => {
    // Login first
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible({ timeout: 15000 });
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=🎫 Ticket Queue')).toBeVisible();

    // Click logout
    await page.click('button:has-text("Logout"), a:has-text("Logout")');

    // Should redirect back to login
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  });

  test('Direct Navigation Blocked After Logout', async ({ page }) => {
    // Navigate directly to protected route
    await page.goto('/#admin/users');

    // Should redirect back to login
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  });
});
