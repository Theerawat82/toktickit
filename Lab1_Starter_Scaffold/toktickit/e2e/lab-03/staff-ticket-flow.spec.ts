import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'child_process';

// Covers: AC-04, AC-05, AC-06, BR-08, BR-10, BR-11
test.describe('IT Staff Ticket Flow', () => {
  test.beforeAll(() => {
    console.log('Seeding database...');
    execSync('npm run prisma:seed', { cwd: './server', stdio: 'inherit' });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app shell to load (login form must be visible first)
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();
  });

  test('Staff Ticket Flow', async ({ page }) => {
    // --- AC-04: IT Staff can view and filter the staff ticket queue ---
    // Login as IT Staff user
    await page.fill('input[type="email"]', 'staff1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for the Staff Ticket Queue to be rendered (not the requester My Tickets view)
    // StaffTicketQueue renders data-testid="staff-queue" with heading "🎫 Ticket Queue"
    await expect(page.locator('[data-testid="staff-queue"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('strong:has-text("🎫 Ticket Queue")')).toBeVisible();

    // --- AC-04: Use search filter ---
    // StaffTicketQueue: search input has placeholder "Search by ticket number or summary..."
    await page.fill('[data-testid="search-input"]', 'TKT-001');

    // Give the debounce/filter time to apply and verify ticket appears
    // The ticket link is rendered as <a href="#ticket/{id}"> with ticketNumber text
    await expect(page.locator('a:has-text("TKT-001")').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // --- AC-04: Apply a status filter ---
    // StaffTicketQueue: filter-status select
    await page.selectOption('[data-testid="filter-status"]', 'Open');
    await expect(page.locator('a:has-text("TKT-001")').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // --- AC-05: View Staff Ticket Detail ---
    // Click the ticket link to open StaffTicketDetail
    await page.locator('a:has-text("TKT-001")').filter({ visible: true }).first().click();
    // StaffTicketDetail renders the ticketNumber in an <h4>
    await expect(page.locator('h4:has-text("TKT-001")')).toBeVisible({ timeout: 10000 });
    // It also renders the summary
    await expect(page.getByText('Login issue', { exact: true })).toBeVisible();

    // --- AC-05: Open the "Service Actions" tab to interact with dropdowns ---
    // Tabs are rendered as <button> with text "⚙️ Service Actions"
    await page.click('button:has-text("Service Actions")');
    await expect(page.locator('text=Ticket Owner')).toBeVisible();

    // --- AC-05: Assign ticket owner (claim) via aria-label select ---
    // The select has aria-label="Ticket Owner" and options from staffUsers
    await page.selectOption('select[aria-label="Ticket Owner"]', { label: 'IT Staff 1' });
    // Success message: "Owner updated successfully."
    await expect(page.locator('.alert-success:has-text("Owner updated successfully")')).toBeVisible({ timeout: 10000 });

    // --- AC-05: Set IT Priority ---
    // The select has aria-label="IT Priority"
    await page.selectOption('select[aria-label="IT Priority"]', 'Urgent');
    await expect(page.locator('.alert-success:has-text("Priority updated successfully")')).toBeVisible({ timeout: 10000 });

    // --- AC-05: Perform a valid status transition (Open → In Progress) ---
    // The select has aria-label="Current Status"; option value is "In Progress" (space not underscore)
    await page.selectOption('select[aria-label="Current Status"]', 'In Progress');
    await expect(page.locator('.alert-success:has-text("Status updated successfully")')).toBeVisible({ timeout: 10000 });

    // --- AC-06: Post a Public Comment ---
    // Switch to the Public Comments tab
    await page.click('button:has-text("Public Comments")');
    // The textarea placeholder is "Write a public comment…" (note the em-dash)
    await page.fill('textarea[placeholder="Write a public comment\u2026"]', 'Investigating the login issue.');
    // Submit button text is "Post Comment"
    await page.click('button:has-text("Post Comment")');
    // Verify the comment appears in the thread
    await expect(page.locator('text=Investigating the login issue.').first()).toBeVisible({ timeout: 10000 });

    // --- BR-10: Add an Internal Note ---
    // Switch to the Internal Notes tab
    await page.click('button:has-text("Internal Notes")');
    // The textarea placeholder is "Write an internal note…" (note the em-dash)
    await page.fill('textarea[placeholder="Write an internal note\u2026"]', 'User account might be locked in AD.');
    // Submit button text is "Add Internal Note"
    await page.click('button:has-text("Add Internal Note")');
    // Verify internal note appears
    await expect(page.locator('text=User account might be locked in AD.')).toBeVisible({ timeout: 10000 });

    // --- BR-11: Log out and verify Requester cannot see Internal Notes ---
    // Go back to queue first (navigate to hash root)
    await page.goto('/');
    // Click logout button
    await page.click('button:has-text("Logout")');
    await expect(page.locator('button[type="submit"]:has-text("Log In")')).toBeVisible();

    // Log in as Requester
    await page.fill('input[type="email"]', 'user1@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Requester sees the My Tickets view (📋 My Tickets)
    await expect(page.locator('strong:has-text("My Tickets")')).toBeVisible({ timeout: 15000 });

    // Navigate directly to TKT-001 via the ticket link (RequesterTicketDetail doesn't show Internal Notes tab)
    // Find the ticket and click it — but as a Requester, TKT-001 was submitted by user1
    await page.locator('a:has-text("TKT-001")').first().click();
    await expect(page.locator('h4:has-text("TKT-001")')).toBeVisible({ timeout: 10000 });

    // Verify the "Internal Notes" tab is NOT visible in RequesterTicketDetail
    // RequesterTicketDetail has no tab at all — it uses a single section with "💬 Public Comments"
    await expect(page.locator('button:has-text("Internal Notes")')).not.toBeVisible();

    // Verify internal note content is hidden from Requester
    await expect(page.locator('text=User account might be locked in AD.')).not.toBeVisible();
  });
});
