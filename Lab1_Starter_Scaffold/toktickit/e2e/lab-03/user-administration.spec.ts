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
    // --- AC-08: Administrator can log in and navigate to User Management ---
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // After login, Admin sees their queue/dashboard and a "User Management" nav link
    // App.tsx line 66-69: rendered as <a href="#admin/users"> with text "User Management"
    await expect(page.locator('a:has-text("User Management")')).toBeVisible({ timeout: 15000 });
    await page.click('a:has-text("User Management")');

    // UserManagement renders <h2>Administrator User Management</h2>
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });

    // --- AC-08: Search users by name and apply role filter ---
    // UserManagement: search input placeholder "Search by Name or Email"
    await page.fill('input[placeholder="Search by Name or Email"]', 'IT Staff 1');
    // Wait for table to update
    await expect(page.locator('td:has-text("staff1@toktickit.com")')).toBeVisible({ timeout: 10000 });

    // Apply role filter — select with options "All Roles", "Requester", "IT Staff", "Administrator"
    // The option value is "IT_Staff" but label is "IT Staff"
    await page.selectOption('.form-select', { label: 'IT Staff' });
    await expect(page.locator('td:has-text("staff1@toktickit.com")')).toBeVisible({ timeout: 10000 });

    // Clear search
    await page.fill('input[placeholder="Search by Name or Email"]', '');
    await page.selectOption('.form-select', { label: 'All Roles' });

    // --- AC-09: Create a new user ---
    // Button text is "+ Create User"
    await page.click('button:has-text("+ Create User")');

    // Modal opens — form fields use id="userName", id="userEmail", id="userRole", id="userPassword"
    await page.fill('#userName', 'New Test User');
    await page.fill('#userEmail', 'newtestuser@toktickit.com');
    await page.selectOption('#userRole', 'Requester');
    await page.fill('#userPassword', 'NewTestPassword1!');

    // Save button text is "Save User"
    await page.click('button:has-text("Save User")');

    // Verify success: UserManagement shows formSuccess "User created successfully"
    await expect(page.locator('.alert-success:has-text("User created successfully")')).toBeVisible({ timeout: 10000 });

    // Wait for the modal to auto-close (1500ms timeout in handleCreateSubmit)
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 5000 });

    // Verify user appears in the table
    await expect(page.locator('td:has-text("newtestuser@toktickit.com")')).toBeVisible({ timeout: 10000 });

    // --- AC-09: Edit the newly created user ---
    const userRow = page.locator('tr').filter({ hasText: 'newtestuser@toktickit.com' });
    await userRow.locator('button:has-text("Edit")').click();

    // Edit modal opens — update name and role
    await page.fill('#userName', 'Edited Test User');
    // IT_Staff option has value "IT_Staff" and label "IT Staff"
    await page.selectOption('#userRole', 'IT_Staff');
    await page.click('button:has-text("Save User")');

    // Verify edit success
    await expect(page.locator('.alert-success:has-text("User updated successfully")')).toBeVisible({ timeout: 10000 });
    // Wait for modal to close
    await page.waitForTimeout(1800);
    await expect(page.locator('td:has-text("Edited Test User")')).toBeVisible({ timeout: 10000 });

    // --- BR-13: Reset password forces mustChangePassword on next login ---
    const editedRow = page.locator('tr').filter({ hasText: 'newtestuser@toktickit.com' });
    await editedRow.locator('button:has-text("Edit")').click();

    // Reset password input: placeholder "New Password"
    await page.fill('input[placeholder="New Password"]', 'ResetPassword123!');
    // Reset button text is "Reset"
    await page.click('button:has-text("Reset")');
    await expect(page.locator('.alert-success:has-text("Password reset successfully")')).toBeVisible({ timeout: 10000 });

    // Close modal with btn-close
    await page.click('button.btn-close');

    // --- BR-13: Log out and verify forced password change on new user ---
    await page.click('button:has-text("Logout")');
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();

    // Log in as the new user with the reset password
    await page.fill('input[type="email"]', 'newtestuser@toktickit.com');
    await page.fill('input[type="password"]', 'ResetPassword123!');
    await page.click('button[type="submit"]');

    // Verify forced password change screen appears
    // ProtectedRoute renders <h5 class="mb-0">Change Your Password</h5> or ChangePassword has <h5>
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible({ timeout: 10000 });

    // Complete the forced password change
    await page.locator('input').nth(0).fill('ResetPassword123!'); // currentPassword
    await page.locator('input').nth(1).fill('FinalPassword123!'); // newPassword
    await page.locator('input').nth(2).fill('FinalPassword123!'); // confirmPassword
    await page.click('button:has-text("Update Password")');

    // After change, the IT_Staff user should see the Staff Ticket Queue
    await expect(page.locator('[data-testid="staff-queue"]')).toBeVisible({ timeout: 15000 });

    // --- Log out and log back in as admin ---
    await page.click('button:has-text("Logout")');
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();

    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('a:has-text("User Management")')).toBeVisible({ timeout: 15000 });
    await page.click('a:has-text("User Management")');
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });

    // --- BR-15: Administrator cannot deactivate themselves ---
    const adminRow = page.locator('tr').filter({ hasText: 'admin@toktickit.com' });
    await adminRow.locator('button:has-text("Edit")').click();

    // Click the "Deactivate" button in the danger zone
    await page.click('button:has-text("Deactivate")');

    // Verify error message is shown
    // formError is displayed as .alert-danger
    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.alert-danger')).toContainText(/[Cc]annot deactivate/);

    // Close the modal
    await page.click('button.btn-close');
  });

  test('Non-Administrator Blocked from User Management', async ({ page }) => {
    // --- AC-09 (Negative): Requester cannot access User Management ---
    // Login as Requester
    await page.fill('input[type="email"]', 'user1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for Requester dashboard (My Tickets)
    await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 15000 });

    // Attempt direct navigation to admin route
    await page.goto('/#admin/users');

    // App.tsx: if hash is #admin/users but role is not Administrator → renders normal requester view
    // ProtectedRoute useEffect will clear the hash back to ""
    // Requester should still see "My Tickets" (not UserManagement)
    await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 10000 });

    // Verify User Management heading is NOT shown
    await expect(page.locator('h2:has-text("Administrator User Management")')).not.toBeVisible();
  });
});
