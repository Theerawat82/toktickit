# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-02\requester-journey.spec.ts >> Requester E2E Journey & Security Checks >> Full Requester Journey and Security Boundary Check
- Location: e2e\lab-02\requester-journey.spec.ts:21:7

# Error details

```
Error: Command failed: npx prisma db seed
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { execSync } from 'child_process';
  3   | import path from 'path';
  4   | import fs from 'fs';
  5   | 
  6   | test.describe('Requester E2E Journey & Security Checks', () => {
  7   | 
  8   |   test.beforeAll(() => {
  9   |     // 1. Ensure test database is initialized with idempotent seed data
  10  |     console.log("Seeding database...");
  11  |     const serverDir = path.resolve(__dirname, '../../server');
> 12  |     execSync('npx prisma db seed', { cwd: serverDir, stdio: 'inherit' });
      |             ^ Error: Command failed: npx prisma db seed
  13  |     
  14  |     // Ensure screenshot directory exists
  15  |     const screenshotDir = path.resolve('artifacts/lab-02/screenshots');
  16  |     if (!fs.existsSync(screenshotDir)) {
  17  |       fs.mkdirSync(screenshotDir, { recursive: true });
  18  |     }
  19  |   });
  20  | 
  21  |   test('Full Requester Journey and Security Boundary Check', async ({ page, request, browserName }) => {
  22  |     // Wait for the app to load
  23  |     await page.goto('/');
  24  | 
  25  |     // a. Context Switch: Select Requester via RequesterSelector UI
  26  |     const dropdown = page.getByTestId('requester-dropdown');
  27  |     await expect(dropdown).toBeVisible({ timeout: 10000 });
  28  |     // Alice Johnson is ID 1 (active)
  29  |     await dropdown.selectOption({ value: '1' });
  30  | 
  31  |     // The Create Ticket Form should now be visible
  32  |     const createForm = page.getByTestId('create-ticket-form');
  33  |     await expect(createForm).toBeVisible();
  34  |     
  35  |     // Screenshot 1: Create Ticket View
  36  |     await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/create-ticket-${browserName}.png`), fullPage: true });
  37  | 
  38  |     // b. Ticket Creation: Verify validation rules (summary max 200, desc min 20)
  39  |     await page.getByTestId('input-summary').fill('A'.repeat(201));
  40  |     await page.getByTestId('input-description').fill('too short');
  41  |     await page.getByTestId('submit-ticket-btn').click();
  42  |     
  43  |     // Check validation errors
  44  |     await expect(page.getByText('Summary cannot exceed 200 characters')).toBeVisible();
  45  |     await expect(page.getByText('Description must be at least 20 characters long')).toBeVisible();
  46  | 
  47  |     // Fill valid data
  48  |     await page.getByTestId('input-summary').fill('Cannot access the ERP system E2E Test');
  49  |     await page.getByTestId('input-description').fill('I am getting an invalid password error when trying to log in. Please help.');
  50  |     
  51  |     // Wait for reference dropdowns to populate, then select
  52  |     const categorySelect = page.getByTestId('select-category');
  53  |     await categorySelect.selectOption({ index: 1 });
  54  | 
  55  |     const systemSelect = page.getByTestId('select-system');
  56  |     await systemSelect.selectOption({ index: 1 });
  57  | 
  58  |     const prioritySelect = page.getByTestId('select-priority');
  59  |     await prioritySelect.selectOption('High');
  60  | 
  61  |     await page.getByTestId('submit-ticket-btn').click();
  62  | 
  63  |     // Verify auto-generated TIK-XXXXX format in success message
  64  |     const successBanner = page.getByTestId('success-banner');
  65  |     await expect(successBanner).toBeVisible();
  66  |     await expect(successBanner).toContainText(/TIK-\d{5}/);
  67  | 
  68  |     // Extract ticket ID from the link in "My Tickets"
  69  |     // Wait for the ticket list to update
  70  |     const myTicketsTable = page.getByTestId('my-tickets');
  71  |     await expect(myTicketsTable).toContainText('Cannot access the ERP system E2E Test');
  72  | 
  73  |     // Screenshot 2: My Tickets List
  74  |     await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/my-tickets-${browserName}.png`), fullPage: true });
  75  | 
  76  |     // c. My Tickets List: Test searching/filtering
  77  |     await page.getByTestId('search-input').fill('E2E Test');
  78  |     // Ensure the ticket is still there
  79  |     await expect(myTicketsTable).toContainText('Cannot access the ERP system E2E Test');
  80  |     
  81  |     // Clear filter
  82  |     await page.getByTestId('search-input').fill('');
  83  |     
  84  |     // Click on the newly created ticket to go to Detail View
  85  |     // Since it's sorted Newest First, it should be the first one
  86  |     const ticketLink = page.locator('a[data-testid^="ticket-link-"]').first();
  87  |     const ticketUrl = await ticketLink.getAttribute('href');
  88  |     const ticketId = ticketUrl?.replace('#ticket/', '');
  89  |     expect(ticketId).toBeDefined();
  90  |     
  91  |     await ticketLink.click();
  92  | 
  93  |     // d. Ticket Detail & Attachments: Access read-only Ticket Detail view
  94  |     // Wait for the ticket details to load
  95  |     await expect(page.getByText('Cannot access the ERP system E2E Test').first()).toBeVisible();
  96  |     await expect(page.getByText('Ticket Information')).toBeVisible();
  97  | 
  98  |     // Ensure NO internal notes/agent comments are visible (verify absence)
  99  |     await expect(page.getByText('Internal Notes')).toHaveCount(0);
  100 |     await expect(page.getByText('Actions Taken')).toHaveCount(0);
  101 | 
  102 |     // Screenshot 3: Ticket Detail View
  103 |     await page.screenshot({ path: path.resolve(`artifacts/lab-02/screenshots/ticket-detail-${browserName}.png`), fullPage: true });
  104 | 
  105 |     // Test attachment uploading
  106 |     const fileChooserPromise = page.waitForEvent('filechooser');
  107 |     // We can't easily upload via UI click if it's hidden, but we can set the input directly using Playwright
  108 |     // Or we click the button that triggers the file input
  109 |     await page.getByText('+ Upload Attachment').click();
  110 |     const fileChooser = await fileChooserPromise;
  111 |     
  112 |     // Upload a valid fake file
```