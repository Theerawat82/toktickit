# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\staff-ticket-flow.spec.ts >> IT Staff Ticket Flow >> Staff Ticket Flow
- Location: e2e\lab-03\staff-ticket-flow.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a:has-text("TKT-001")').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('a:has-text("TKT-001")').first()

```

```yaml
- heading "TokTickIT IT Service Desk" [level=1]
- paragraph: IT Support Request System
- text: IT Staff 1 IT_Staff
- button "Logout"
- strong: 🎫 Ticket Queue
- text: IT Staff ticket overview
- button "✕ Clear Filters"
- textbox "Search by ticket number or summary...": TKT-001
- combobox:
  - option "All Statuses"
  - option "New"
  - option "Open" [selected]
  - option "In Progress"
  - option "Waiting for Requester"
  - option "Resolved"
  - option "Closed"
  - option "Reopened"
  - option "Cancelled"
- combobox:
  - option "All Categories" [selected]
  - option "Account and Access"
  - option "Hardware"
  - option "Software"
  - option "Network"
- combobox:
  - option "All Priorities" [selected]
  - option "Low"
  - option "Medium"
  - option "High"
  - option "Urgent"
- combobox:
  - option "All Owners" [selected]
  - option "Admin User"
  - option "Edited Test User"
  - option "IT Staff 1"
  - option "IT Staff 2"
  - option "New Temp Staff"
- combobox:
  - option "Newest First" [selected]
  - option "Oldest First"
  - option "Recently Updated"
- text: 🔍
- heading "No matching tickets" [level=5]
- paragraph: Try adjusting your search or filter criteria.
- button "Clear Filters"
- separator
- button "[Check System]"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | // @ts-ignore
  3   | import { execSync } from 'child_process';
  4   | 
  5   | // Covers: AC-04, AC-05, AC-06, BR-08, BR-10, BR-11
  6   | test.describe('IT Staff Ticket Flow', () => {
  7   |   test.beforeAll(() => {
  8   |     console.log('Seeding database...');
  9   |     execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  10  |   });
  11  | 
  12  |   test.beforeEach(async ({ page }) => {
  13  |     await page.goto('/');
  14  |     // Wait for the app shell to load (login form must be visible first)
  15  |     await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  16  |   });
  17  | 
  18  |   test('Staff Ticket Flow', async ({ page }) => {
  19  |     // --- AC-04: IT Staff can view and filter the staff ticket queue ---
  20  |     // Login as IT Staff user
  21  |     await page.fill('input[type="email"]', 'staff1@toktickit.com');
  22  |     await page.fill('input[type="password"]', 'Password123!');
  23  |     await page.click('button[type="submit"]');
  24  | 
  25  |     // Wait for the Staff Ticket Queue to be rendered (not the requester My Tickets view)
  26  |     // StaffTicketQueue renders data-testid="staff-queue" with heading "🎫 Ticket Queue"
  27  |     await expect(page.locator('[data-testid="staff-queue"]')).toBeVisible({ timeout: 15000 });
  28  |     await expect(page.locator('strong:has-text("🎫 Ticket Queue")')).toBeVisible();
  29  | 
  30  |     // --- AC-04: Use search filter ---
  31  |     // StaffTicketQueue: search input has placeholder "Search by ticket number or summary..."
  32  |     await page.fill('[data-testid="search-input"]', 'TKT-001');
  33  | 
  34  |     // Give the debounce/filter time to apply and verify ticket appears
  35  |     // The ticket link is rendered as <a href="#ticket/{id}"> with ticketNumber text
  36  |     await expect(page.locator('a:has-text("TKT-001")').first()).toBeVisible({ timeout: 10000 });
  37  | 
  38  |     // --- AC-04: Apply a status filter ---
  39  |     // StaffTicketQueue: filter-status select
  40  |     await page.selectOption('[data-testid="filter-status"]', 'Open');
> 41  |     await expect(page.locator('a:has-text("TKT-001")').first()).toBeVisible({ timeout: 10000 });
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  42  | 
  43  |     // --- AC-05: View Staff Ticket Detail ---
  44  |     // Click the ticket link to open StaffTicketDetail
  45  |     await page.locator('a:has-text("TKT-001")').first().click();
  46  |     // StaffTicketDetail renders the ticketNumber in an <h4>
  47  |     await expect(page.locator('h4:has-text("TKT-001")')).toBeVisible({ timeout: 10000 });
  48  |     // It also renders the summary
  49  |     await expect(page.locator('text=Login issue')).toBeVisible();
  50  | 
  51  |     // --- AC-05: Open the "Service Actions" tab to interact with dropdowns ---
  52  |     // Tabs are rendered as <button> with text "⚙️ Service Actions"
  53  |     await page.click('button:has-text("Service Actions")');
  54  |     await expect(page.locator('text=Ticket Owner')).toBeVisible();
  55  | 
  56  |     // --- AC-05: Assign ticket owner (claim) via aria-label select ---
  57  |     // The select has aria-label="Ticket Owner" and options from staffUsers
  58  |     await page.selectOption('select[aria-label="Ticket Owner"]', { label: 'IT Staff 1' });
  59  |     // Success message: "Owner updated successfully."
  60  |     await expect(page.locator('.alert-success:has-text("Owner updated successfully")')).toBeVisible({ timeout: 10000 });
  61  | 
  62  |     // --- AC-05: Set IT Priority ---
  63  |     // The select has aria-label="IT Priority"
  64  |     await page.selectOption('select[aria-label="IT Priority"]', 'Urgent');
  65  |     await expect(page.locator('.alert-success:has-text("Priority updated successfully")')).toBeVisible({ timeout: 10000 });
  66  | 
  67  |     // --- AC-05: Perform a valid status transition (Open → In Progress) ---
  68  |     // The select has aria-label="Current Status"; option value is "In Progress" (space not underscore)
  69  |     await page.selectOption('select[aria-label="Current Status"]', 'In Progress');
  70  |     await expect(page.locator('.alert-success:has-text("Status updated successfully")')).toBeVisible({ timeout: 10000 });
  71  | 
  72  |     // --- AC-06: Post a Public Comment ---
  73  |     // Switch to the Public Comments tab
  74  |     await page.click('button:has-text("Public Comments")');
  75  |     // The textarea placeholder is "Write a public comment…" (note the em-dash)
  76  |     await page.fill('textarea[placeholder="Write a public comment\u2026"]', 'Investigating the login issue.');
  77  |     // Submit button text is "Post Comment"
  78  |     await page.click('button:has-text("Post Comment")');
  79  |     // Verify the comment appears in the thread
  80  |     await expect(page.locator('text=Investigating the login issue.')).toBeVisible({ timeout: 10000 });
  81  | 
  82  |     // --- BR-10: Add an Internal Note ---
  83  |     // Switch to the Internal Notes tab
  84  |     await page.click('button:has-text("Internal Notes")');
  85  |     // The textarea placeholder is "Write an internal note…" (note the em-dash)
  86  |     await page.fill('textarea[placeholder="Write an internal note\u2026"]', 'User account might be locked in AD.');
  87  |     // Submit button text is "Add Internal Note"
  88  |     await page.click('button:has-text("Add Internal Note")');
  89  |     // Verify internal note appears
  90  |     await expect(page.locator('text=User account might be locked in AD.')).toBeVisible({ timeout: 10000 });
  91  | 
  92  |     // --- BR-11: Log out and verify Requester cannot see Internal Notes ---
  93  |     // Go back to queue first (navigate to hash root)
  94  |     await page.goto('/');
  95  |     // Click logout button
  96  |     await page.click('button:has-text("Logout")');
  97  |     await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  98  | 
  99  |     // Log in as Requester
  100 |     await page.fill('input[type="email"]', 'user1@toktickit.com');
  101 |     await page.fill('input[type="password"]', 'Password123!');
  102 |     await page.click('button[type="submit"]');
  103 | 
  104 |     // Requester sees the My Tickets view (📋 My Tickets)
  105 |     await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 15000 });
  106 | 
  107 |     // Navigate directly to TKT-001 via the ticket link (RequesterTicketDetail doesn't show Internal Notes tab)
  108 |     // Find the ticket and click it — but as a Requester, TKT-001 was submitted by user1
  109 |     await page.locator('a:has-text("TKT-001")').first().click();
  110 |     await expect(page.locator('h4:has-text("TKT-001")')).toBeVisible({ timeout: 10000 });
  111 | 
  112 |     // Verify the "Internal Notes" tab is NOT visible in RequesterTicketDetail
  113 |     // RequesterTicketDetail has no tab at all — it uses a single section with "💬 Public Comments"
  114 |     await expect(page.locator('button:has-text("Internal Notes")')).not.toBeVisible();
  115 | 
  116 |     // Verify internal note content is hidden from Requester
  117 |     await expect(page.locator('text=User account might be locked in AD.')).not.toBeVisible();
  118 |   });
  119 | });
  120 | 
```