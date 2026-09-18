# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\user-administration.spec.ts >> Admin User Management >> User Administration Flow
- Location: e2e\lab-03\user-administration.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.alert-success:has-text("User created successfully")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.alert-success:has-text("User created successfully")')

```

```yaml
- heading "TokTickIT IT Service Desk" [level=1]
- paragraph: IT Support Request System
- text: Admin User Administrator
- link "User Management":
  - /url: "#admin/users"
- link "Queue":
  - /url: "#"
- button "Logout"
- heading "Administrator User Management" [level=2]
- button "+ Create User"
- textbox "Search by Name or Email"
- combobox:
  - option "All Roles" [selected]
  - option "Requester"
  - option "IT Staff"
  - option "Administrator"
- table:
  - rowgroup:
    - row "Name Email Role Status Actions":
      - columnheader "Name"
      - columnheader "Email"
      - columnheader "Role"
      - columnheader "Status"
      - columnheader "Actions"
  - rowgroup:
    - row "Edited Test User newtestuser@toktickit.com IT Staff Active Edit":
      - cell "Edited Test User"
      - cell "newtestuser@toktickit.com"
      - cell "IT Staff"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "Inactive User inactive@toktickit.com Requester Inactive Edit":
      - cell "Inactive User"
      - cell "inactive@toktickit.com"
      - cell "Requester"
      - cell "Inactive"
      - cell "Edit":
        - button "Edit"
    - row "New Temp Staff newstaff@toktickit.com IT Staff Active Edit":
      - cell "New Temp Staff"
      - cell "newstaff@toktickit.com"
      - cell "IT Staff"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "Requester 1 user1@toktickit.com Requester Active Edit":
      - cell "Requester 1"
      - cell "user1@toktickit.com"
      - cell "Requester"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "IT Staff 2 staff2@toktickit.com IT Staff Active Edit":
      - cell "IT Staff 2"
      - cell "staff2@toktickit.com"
      - cell "IT Staff"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "IT Staff 1 staff1@toktickit.com IT Staff Active Edit":
      - cell "IT Staff 1"
      - cell "staff1@toktickit.com"
      - cell "IT Staff"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "Admin User admin@toktickit.com Administrator Active Edit":
      - cell "Admin User"
      - cell "admin@toktickit.com"
      - cell "Administrator"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
    - row "Default Requester default_requester@toktickit.com Requester Active Edit":
      - cell "Default Requester"
      - cell "default_requester@toktickit.com"
      - cell "Requester"
      - cell "Active"
      - cell "Edit":
        - button "Edit"
- heading "Create User" [level=5]
- button
- text: User with this email already exists. Name
- textbox "Name": New Test User
- text: Email
- textbox "Email": newtestuser@toktickit.com
- text: Role
- combobox "Role":
  - option "Requester" [selected]
  - option "IT Staff"
  - option "Administrator"
- text: Initial Password
- textbox "Initial Password": NewTestPassword1!
- switch "Active Account" [checked]
- text: Active Account
- button "Cancel"
- button "Save User"
- separator
- button "[Check System]"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | // @ts-ignore
  3   | import { execSync } from 'child_process';
  4   | 
  5   | // Covers: AC-08, AC-09, BR-12, BR-13, BR-14, BR-15
  6   | test.describe('Admin User Management', () => {
  7   |   test.beforeAll(() => {
  8   |     console.log('Seeding database...');
  9   |     execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  10  |   });
  11  | 
  12  |   test.beforeEach(async ({ page }) => {
  13  |     await page.goto('/');
  14  |     // Wait for login form before each test
  15  |     await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  16  |   });
  17  | 
  18  |   test('User Administration Flow', async ({ page }) => {
  19  |     // --- AC-08: Administrator can log in and navigate to User Management ---
  20  |     await page.fill('input[type="email"]', 'admin@toktickit.com');
  21  |     await page.fill('input[type="password"]', 'Password123!');
  22  |     await page.click('button[type="submit"]');
  23  | 
  24  |     // After login, Admin sees their queue/dashboard and a "User Management" nav link
  25  |     // App.tsx line 66-69: rendered as <a href="#admin/users"> with text "User Management"
  26  |     await expect(page.locator('a:has-text("User Management")')).toBeVisible({ timeout: 15000 });
  27  |     await page.click('a:has-text("User Management")');
  28  | 
  29  |     // UserManagement renders <h2>Administrator User Management</h2>
  30  |     await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });
  31  | 
  32  |     // --- AC-08: Search users by name and apply role filter ---
  33  |     // UserManagement: search input placeholder "Search by Name or Email"
  34  |     await page.fill('input[placeholder="Search by Name or Email"]', 'IT Staff 1');
  35  |     // Wait for table to update
  36  |     await expect(page.locator('td:has-text("staff1@toktickit.com")')).toBeVisible({ timeout: 10000 });
  37  | 
  38  |     // Apply role filter — select with options "All Roles", "Requester", "IT Staff", "Administrator"
  39  |     // The option value is "IT_Staff" but label is "IT Staff"
  40  |     await page.selectOption('.form-select', { label: 'IT Staff' });
  41  |     await expect(page.locator('td:has-text("staff1@toktickit.com")')).toBeVisible({ timeout: 10000 });
  42  | 
  43  |     // Clear search
  44  |     await page.fill('input[placeholder="Search by Name or Email"]', '');
  45  |     await page.selectOption('.form-select', { label: 'All Roles' });
  46  | 
  47  |     // --- AC-09: Create a new user ---
  48  |     // Button text is "+ Create User"
  49  |     await page.click('button:has-text("+ Create User")');
  50  | 
  51  |     // Modal opens — form fields use id="userName", id="userEmail", id="userRole", id="userPassword"
  52  |     await page.fill('#userName', 'New Test User');
  53  |     await page.fill('#userEmail', 'newtestuser@toktickit.com');
  54  |     await page.selectOption('#userRole', 'Requester');
  55  |     await page.fill('#userPassword', 'NewTestPassword1!');
  56  | 
  57  |     // Save button text is "Save User"
  58  |     await page.click('button:has-text("Save User")');
  59  | 
  60  |     // Verify success: UserManagement shows formSuccess "User created successfully"
> 61  |     await expect(page.locator('.alert-success:has-text("User created successfully")')).toBeVisible({ timeout: 10000 });
      |                                                                                        ^ Error: expect(locator).toBeVisible() failed
  62  | 
  63  |     // Wait for the modal to auto-close (1500ms timeout in handleCreateSubmit)
  64  |     await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 5000 });
  65  | 
  66  |     // Verify user appears in the table
  67  |     await expect(page.locator('td:has-text("newtestuser@toktickit.com")')).toBeVisible({ timeout: 10000 });
  68  | 
  69  |     // --- AC-09: Edit the newly created user ---
  70  |     const userRow = page.locator('tr').filter({ hasText: 'newtestuser@toktickit.com' });
  71  |     await userRow.locator('button:has-text("Edit")').click();
  72  | 
  73  |     // Edit modal opens — update name and role
  74  |     await page.fill('#userName', 'Edited Test User');
  75  |     // IT_Staff option has value "IT_Staff" and label "IT Staff"
  76  |     await page.selectOption('#userRole', 'IT_Staff');
  77  |     await page.click('button:has-text("Save User")');
  78  | 
  79  |     // Verify edit success
  80  |     await expect(page.locator('.alert-success:has-text("User updated successfully")')).toBeVisible({ timeout: 10000 });
  81  |     // Wait for modal to close
  82  |     await page.waitForTimeout(1800);
  83  |     await expect(page.locator('td:has-text("Edited Test User")')).toBeVisible({ timeout: 10000 });
  84  | 
  85  |     // --- BR-13: Reset password forces mustChangePassword on next login ---
  86  |     const editedRow = page.locator('tr').filter({ hasText: 'newtestuser@toktickit.com' });
  87  |     await editedRow.locator('button:has-text("Edit")').click();
  88  | 
  89  |     // Reset password input: placeholder "New Password"
  90  |     await page.fill('input[placeholder="New Password"]', 'ResetPassword123!');
  91  |     // Reset button text is "Reset"
  92  |     await page.click('button:has-text("Reset")');
  93  |     await expect(page.locator('.alert-success:has-text("Password reset successfully")')).toBeVisible({ timeout: 10000 });
  94  | 
  95  |     // Close modal with btn-close
  96  |     await page.click('button.btn-close');
  97  | 
  98  |     // --- BR-13: Log out and verify forced password change on new user ---
  99  |     await page.click('button:has-text("Logout")');
  100 |     await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  101 | 
  102 |     // Log in as the new user with the reset password
  103 |     await page.fill('input[type="email"]', 'newtestuser@toktickit.com');
  104 |     await page.fill('input[type="password"]', 'ResetPassword123!');
  105 |     await page.click('button[type="submit"]');
  106 | 
  107 |     // Verify forced password change screen appears
  108 |     // ProtectedRoute renders <h5 class="mb-0">Change Your Password</h5> or ChangePassword has <h5>
  109 |     await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible({ timeout: 10000 });
  110 | 
  111 |     // Complete the forced password change
  112 |     await page.locator('input').nth(0).fill('ResetPassword123!'); // currentPassword
  113 |     await page.locator('input').nth(1).fill('FinalPassword123!'); // newPassword
  114 |     await page.locator('input').nth(2).fill('FinalPassword123!'); // confirmPassword
  115 |     await page.click('button:has-text("Update Password")');
  116 | 
  117 |     // After change, the IT_Staff user should see the Staff Ticket Queue
  118 |     await expect(page.locator('[data-testid="staff-queue"]')).toBeVisible({ timeout: 15000 });
  119 | 
  120 |     // --- Log out and log back in as admin ---
  121 |     await page.click('button:has-text("Logout")');
  122 |     await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  123 | 
  124 |     await page.fill('input[type="email"]', 'admin@toktickit.com');
  125 |     await page.fill('input[type="password"]', 'Password123!');
  126 |     await page.click('button[type="submit"]');
  127 |     await expect(page.locator('a:has-text("User Management")')).toBeVisible({ timeout: 15000 });
  128 |     await page.click('a:has-text("User Management")');
  129 |     await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible({ timeout: 10000 });
  130 | 
  131 |     // --- BR-15: Administrator cannot deactivate themselves ---
  132 |     const adminRow = page.locator('tr').filter({ hasText: 'admin@toktickit.com' });
  133 |     await adminRow.locator('button:has-text("Edit")').click();
  134 | 
  135 |     // Click the "Deactivate" button in the danger zone
  136 |     await page.click('button:has-text("Deactivate")');
  137 | 
  138 |     // Verify error message is shown
  139 |     // formError is displayed as .alert-danger
  140 |     await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10000 });
  141 |     await expect(page.locator('.alert-danger')).toContainText(/[Cc]annot deactivate/);
  142 | 
  143 |     // Close the modal
  144 |     await page.click('button.btn-close');
  145 |   });
  146 | 
  147 |   test('Non-Administrator Blocked from User Management', async ({ page }) => {
  148 |     // --- AC-09 (Negative): Requester cannot access User Management ---
  149 |     // Login as Requester
  150 |     await page.fill('input[type="email"]', 'user1@toktickit.com');
  151 |     await page.fill('input[type="password"]', 'Password123!');
  152 |     await page.click('button[type="submit"]');
  153 | 
  154 |     // Wait for Requester dashboard (My Tickets)
  155 |     await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 15000 });
  156 | 
  157 |     // Attempt direct navigation to admin route
  158 |     await page.goto('/#admin/users');
  159 | 
  160 |     // App.tsx: if hash is #admin/users but role is not Administrator → renders normal requester view
  161 |     // ProtectedRoute useEffect will clear the hash back to ""
```