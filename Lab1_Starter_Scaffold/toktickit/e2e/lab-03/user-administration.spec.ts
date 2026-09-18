import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'child_process';

// Covers: AC-08, AC-09, BR-12, BR-13, BR-14, BR-15
test.describe('Admin User Management', () => {
  test.beforeAll(() => {
    console.log('Seeding database...');
    execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for login form before each test
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  });

  test('User Administration Flow', async ({ page }) => {
    const testEmail = `newtestuser_${Date.now()}@toktickit.com`;

    // --- AC-08: Administrator can log in and navigate to User Management ---
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // ตัวแปรจับปุ่ม Hamburger Menu บน Mobile
    const navToggle = page.locator('button.navbar-toggler, button[aria-label="Toggle navigation"]');

    // เปิดเมนูก่อนกดลิงก์ถ้าอยู่บนหน้าจอ Mobile
    if (await navToggle.isVisible()) { await navToggle.click(); }

    const userMgmtLink = page.locator('a:has-text("User Management")').filter({ visible: true });
    await expect(userMgmtLink).toBeVisible({ timeout: 15000 });
    await userMgmtLink.click();

    // UserManagement renders <h2>Administrator User Management</h2>
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });

    // --- AC-08: Search users by name and apply role filter ---
    await page.fill('input[placeholder="Search by Name or Email"]', 'IT Staff 1');
    await expect(page.locator('text="staff1@toktickit.com"').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // Apply role filter
    await page.selectOption('.form-select', { label: 'IT Staff' });
    await expect(page.locator('text="staff1@toktickit.com"').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // Clear search
    await page.fill('input[placeholder="Search by Name or Email"]', '');
    await page.selectOption('.form-select', { label: 'All Roles' });

    // --- AC-09: Create a new user ---
    await page.click('button:has-text("+ Create User")');

    await page.fill('#userName', 'New Test User');
    await page.fill('#userEmail', testEmail);
    await page.selectOption('#userRole', 'Requester');
    await page.fill('#userPassword', 'NewTestPassword1!');

    // Save button text is "Save User"
    await page.locator('button:has-text("Save User")').filter({ visible: true }).click();

    // Verify success
    await expect(page.locator('.alert-success:has-text("User created successfully")').filter({ visible: true })).toBeVisible({ timeout: 10000 });

    // Wait for the modal to auto-close
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 5000 });

    // Verify user appears in table/card list
    await expect(page.locator(`text="${testEmail}"`).filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // --- AC-09: Edit the newly created user ---
    const userRow = page.locator('tbody tr').filter({ hasText: testEmail }).filter({ visible: true }).first();
    await userRow.locator('button:has-text("Edit")').click();

    await page.fill('#userName', 'Edited Test User');
    await page.selectOption('#userRole', 'IT_Staff');
    await page.locator('button:has-text("Save User")').filter({ visible: true }).click();

    await expect(page.locator('.alert-success:has-text("User updated successfully")').filter({ visible: true })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1800);
    await expect(page.locator('text="Edited Test User"').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // --- BR-13: Reset password forces mustChangePassword on next login ---
    const editedRow = page.locator('tbody tr').filter({ hasText: testEmail }).filter({ visible: true }).first();
    await editedRow.locator('button:has-text("Edit")').click();

    await page.fill('input[placeholder="New Password"]', 'ResetPassword123!');
    await page.click('button:has-text("Reset")');
    await expect(page.locator('.alert-success:has-text("Password reset successfully")').filter({ visible: true })).toBeVisible({ timeout: 10000 });

    // [จุดปิด Modal ที่ 1]
    await page.locator('button.btn-close').filter({ visible: true }).click();

    // --- BR-13: Log out and verify forced password change on new user ---
    if (await navToggle.isVisible()) { await navToggle.click(); }
    await page.click('button:has-text("Logout")');
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();

    // Log in as the new user with the reset password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'ResetPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible({ timeout: 10000 });

    await page.locator('input').nth(0).fill('ResetPassword123!');
    await page.locator('input').nth(1).fill('FinalPassword123!');
    await page.locator('input').nth(2).fill('FinalPassword123!');
    await page.click('button:has-text("Update Password")');

    await expect(page.locator('[data-testid="staff-queue"]')).toBeVisible({ timeout: 15000 });

    // --- Log out and log back in as admin ---
    if (await navToggle.isVisible()) { await navToggle.click(); }
    await page.click('button:has-text("Logout")');
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();

    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    if (await navToggle.isVisible()) { await navToggle.click(); }
    await page.locator('a:has-text("User Management")').filter({ visible: true }).click();
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });

    // --- BR-15: Administrator cannot deactivate themselves ---
    const adminRow = page.locator('tbody tr').filter({ hasText: 'admin@toktickit.com' }).filter({ visible: true }).first();
    await adminRow.locator('button:has-text("Edit")').click();

    await page.click('button:has-text("Deactivate")');

    await expect(page.locator('.alert-danger').filter({ visible: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').filter({ visible: true })).toContainText(/[Cc]annot deactivate/);

    // [จุดปิด Modal ที่ 2]
    await page.locator('button.btn-close').filter({ visible: true }).click();

    // --- BR-14: Cannot remove last Administrator ---
    await adminRow.locator('button:has-text("Edit")').click();

    await page.selectOption('#userRole', 'IT_Staff');
    await page.locator('button:has-text("Save User")').filter({ visible: true }).click();

    await expect(page.locator('.alert-danger').filter({ visible: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger').filter({ visible: true })).toContainText(/last active Administrator/i);

    // [จุดปิด Modal ที่ 3]
    await page.locator('button.btn-close').filter({ visible: true }).click();
  });

  test('Non-Administrator Blocked from User Management', async ({ page }) => {
    await page.fill('input[type="email"]', 'user1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 15000 });

    await page.goto('/#admin/users');

    await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Administrator User Management")')).not.toBeVisible();
  });
});
