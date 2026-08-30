import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

test.describe('Requester E2E Journey & Security Checks', () => {

  test.beforeAll(() => {
    // 1. Ensure test database is initialized with idempotent seed data
    console.log("Seeding database...");
    const serverDir = path.resolve(__dirname, '../../server');
    execSync('npx prisma db seed', { cwd: serverDir, stdio: 'inherit' });
    
    // Ensure screenshot directory exists
    const screenshotDir = path.resolve('artifacts/lab-02/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Full Requester Journey and Security Boundary Check', async ({ page, request, browserName }) => {
    // Wait for the app to load
    await page.goto('/');

    // a. Context Switch: Select Requester via RequesterSelector UI
    const dropdown = page.getByTestId('requester-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    // Alice Johnson is ID 1 (active)
    await dropdown.selectOption({ value: '1' });

    // The Create Ticket Form should now be visible
    const createForm = page.getByTestId('create-ticket-form');
    await expect(createForm).toBeVisible();
    
    // Screenshot 1: Create Ticket View
    await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/create-ticket-${browserName}.png`), fullPage: true });

    // b. Ticket Creation: Verify validation rules (summary max 200, desc min 20)
    await page.getByTestId('input-summary').fill('A'.repeat(201));
    await page.getByTestId('input-description').fill('too short');
    await page.getByTestId('submit-ticket-btn').click();
    
    // Check validation errors
    await expect(page.getByText('Summary cannot exceed 200 characters')).toBeVisible();
    await expect(page.getByText('Description must be at least 20 characters long')).toBeVisible();

    // Fill valid data
    await page.getByTestId('input-summary').fill('Cannot access the ERP system E2E Test');
    await page.getByTestId('input-description').fill('I am getting an invalid password error when trying to log in. Please help.');
    
    // Wait for reference dropdowns to populate, then select
    const categorySelect = page.getByTestId('select-category');
    await categorySelect.selectOption({ index: 1 });

    const systemSelect = page.getByTestId('select-system');
    await systemSelect.selectOption({ index: 1 });

    const prioritySelect = page.getByTestId('select-priority');
    await prioritySelect.selectOption('High');

    await page.getByTestId('submit-ticket-btn').click();

    // Verify auto-generated TIK-XXXXX format in success message
    const successBanner = page.getByTestId('success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText(/TIK-\d{5}/);

    // Extract ticket ID from the link in "My Tickets"
    // Wait for the ticket list to update
    const myTicketsTable = page.getByTestId('my-tickets');
    await expect(myTicketsTable).toContainText('Cannot access the ERP system E2E Test');

    // Screenshot 2: My Tickets List
    await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/my-tickets-${browserName}.png`), fullPage: true });

    // c. My Tickets List: Test searching/filtering
    await page.getByTestId('search-input').fill('E2E Test');
    // Ensure the ticket is still there
    await expect(myTicketsTable).toContainText('Cannot access the ERP system E2E Test');
    
    // Clear filter
    await page.getByTestId('search-input').fill('');
    
    // Click on the newly created ticket to go to Detail View
    // Since it's sorted Newest First, it should be the first one
    const ticketLink = page.locator('a[data-testid^="ticket-link-"]').first();
    const ticketUrl = await ticketLink.getAttribute('href');
    const ticketId = ticketUrl?.replace('#ticket/', '');
    expect(ticketId).toBeDefined();
    
    await ticketLink.click();

    // d. Ticket Detail & Attachments: Access read-only Ticket Detail view
    // Wait for the ticket details to load
    await expect(page.getByText('Cannot access the ERP system E2E Test').first()).toBeVisible();
    await expect(page.getByText('Ticket Information')).toBeVisible();

    // Ensure NO internal notes/agent comments are visible (verify absence)
    await expect(page.getByText('Internal Notes')).toHaveCount(0);
    await expect(page.getByText('Actions Taken')).toHaveCount(0);

    // Screenshot 3: Ticket Detail View
    await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/ticket-detail-${browserName}.png`), fullPage: true });

    // Test attachment uploading
    const fileChooserPromise = page.waitForEvent('filechooser');
    // We can't easily upload via UI click if it's hidden, but we can set the input directly using Playwright
    // Or we click the button that triggers the file input
    await page.getByText('+ Upload Attachment').click();
    const fileChooser = await fileChooserPromise;
    
    // Upload a valid fake file
    const fakeFilePath = path.resolve(__dirname, 'test-dummy.pdf');
    fs.writeFileSync(fakeFilePath, 'dummy content');
    
    await fileChooser.setFiles(fakeFilePath);
    
    // Wait for it to appear in the list
    await expect(page.getByText('test-dummy.pdf')).toBeVisible();

    // Test soft-removal with reason
    await page.getByTitle('Remove attachment').click();
    await expect(page.getByText('Remove Attachment')).toBeVisible(); // Modal title
    
    // Try to confirm without reason
    await page.getByRole('button', { name: 'Remove', exact: true }).nth(1).click();
    await expect(page.getByText('Removal reason is required.')).toBeVisible();

    // Fill reason and remove
    await page.getByPlaceholder('Enter a reason').fill('Uploaded wrong file');
    await page.getByRole('button', { name: 'Remove', exact: true }).nth(1).click();

    // Verify it is marked as removed and reason is visible
    await expect(page.getByText('Removed: Uploaded wrong file')).toBeVisible();

    // Clean up dummy file
    fs.unlinkSync(fakeFilePath);

    // e. Security & Boundary Test: Attempt direct URL navigation / API access to a ticket owned by a different requester
    // We are currently Alice (ID 1). We know Alice's ticket is ticketId.
    // Let's create an API context as Bob (ID 2) and try to access Alice's ticket.
    const bobApiContext = await request.fetch(`/api/tickets/${ticketId}`, {
      method: 'GET',
      headers: {
        'x-requester-id': '2' // Bob's ID
      }
    });
    
    expect(bobApiContext.status()).toBe(403);
    const bobBody = await bobApiContext.json();
    expect(bobBody.error).toContain('Forbidden');
  });
});
