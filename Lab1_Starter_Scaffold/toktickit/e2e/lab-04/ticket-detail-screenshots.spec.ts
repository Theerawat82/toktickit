import { test, expect, Page } from '@playwright/test';

/**
 * Part 6 evidence: Ticket Detail with a visible Action Taken row.
 *  - IT Staff view (Edit button must be clickable and open the form)
 *  - Requester read-only view (no Edit / Add buttons)
 * Captured at desktop / tablet / mobile widths, and the Actions Taken
 * overflow wrapper is measured so the layout can be sanity-checked.
 *
 * Runs once (Desktop Chrome project) - viewports are set explicitly per shot.
 */
const OUT = 'artifacts/lab-04/screenshots';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
] as const;

const ACTION_DESCRIPTION = 'Reset VPN profile and cleared cached credentials on the laptop';
const ACTION_RESULT = 'User reconnected to VPN successfully and confirmed access to shared drive';

async function login(page: Page, email: string) {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Logout')).toBeVisible();
}

async function openTicket(page: Page, from: '#queue' | '#') {
  await page.goto('/' + (from === '#queue' ? '#queue' : ''));
  if (from === '#queue') {
    await page.fill('[data-testid="search-input"]', 'TKT-001');
  }
  const href = await page.locator('a:has-text("TKT-001")').first().getAttribute('href');
  await page.goto('/' + href);
  await expect(page.locator('h3:has-text("Actions Taken")')).toBeVisible();
}

/** Measure the overflow wrapper around ActionsTaken so we can report on it. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.textContent?.includes('Actions Taken'));
    const table = h3?.parentElement?.querySelector('table') ?? null;
    const host = (table?.parentElement ?? null) as HTMLElement | null;   // div with overflowX:auto around the table
    const col = document.querySelector('.col-lg-8') as HTMLElement | null;
    const sidebar = document.querySelector('.col-lg-4') as HTMLElement | null;
    const hostRect = host?.getBoundingClientRect();
    const sideRect = sidebar?.getBoundingClientRect();
    return {
      wrapperClientWidth: host?.clientWidth,
      wrapperScrollWidth: host?.scrollWidth,
      scrollsHorizontally: !!host && host.scrollWidth > host.clientWidth,
      columnWidth: col?.clientWidth,
      pageHasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overlapsSidebar:
        !!hostRect && !!sideRect && hostRect.right > sideRect.left + 1 && hostRect.bottom > sideRect.top && hostRect.top < sideRect.bottom,
    };
  });
}

test.describe('Part 6: Ticket Detail with Action Taken (staff + requester, 3 viewports)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'single run; viewports set explicitly');
  });

  test('capture staff and requester ticket detail views', async ({ browser }) => {
    const report: Record<string, unknown> = {};

    // ---------- IT Staff ----------
    const staffCtx = await browser.newContext();
    const staff = await staffCtx.newPage();
    await login(staff, 'staff1@toktickit.com');
    await staff.setViewportSize({ width: 1280, height: 800 });
    await openTicket(staff, '#queue');

    if ((await staff.locator(`td:has-text("${ACTION_DESCRIPTION}")`).count()) === 0) {
      await staff.click('text=Add Action Taken');
      await staff.fill('textarea[name="actionDescription"]', ACTION_DESCRIPTION);
      await staff.fill('textarea[name="result"]', ACTION_RESULT);
      await staff.click('button:has-text("Save")');
    }
    await expect(staff.locator(`td:has-text("${ACTION_DESCRIPTION}")`).first()).toBeVisible();

    for (const vp of VIEWPORTS) {
      await staff.setViewportSize({ width: vp.width, height: vp.height });
      await staff.reload();
      await expect(staff.locator(`td:has-text("${ACTION_DESCRIPTION}")`).first()).toBeVisible();
      await staff.waitForTimeout(400);

      // Edit button must be genuinely clickable (not covered by the sidebar column)
      // Screenshot FIRST (natural scroll position), then prove Edit is clickable
      report[`staff-${vp.name}`] = await measure(staff);
      await staff.screenshot({ path: `${OUT}/ticket-detail-actions-staff-${vp.name}.png`, fullPage: true });
      const edit = staff.locator('button:has-text("Edit")').first();
      await edit.scrollIntoViewIfNeeded();
      await edit.click({ timeout: 5000 });
      await expect(staff.locator('textarea[name="actionDescription"]')).toBeVisible();
      if (vp.name === 'desktop') {
        await staff.screenshot({ path: `${OUT}/ticket-detail-actions-staff-desktop-edit-form.png`, fullPage: true });
      }
      await staff.click('button:has-text("Cancel")');
      await expect(staff.locator('textarea[name="actionDescription"]')).toHaveCount(0);
    }

    // ---------- Requester (read-only) ----------
    const reqCtx = await browser.newContext();
    const req = await reqCtx.newPage();
    await login(req, 'user1@toktickit.com');
    await req.setViewportSize({ width: 1280, height: 800 });
    await openTicket(req, '#');

    for (const vp of VIEWPORTS) {
      await req.setViewportSize({ width: vp.width, height: vp.height });
      await req.reload();
      await expect(req.locator(`td:has-text("${ACTION_DESCRIPTION}")`).first()).toBeVisible();
      await req.waitForTimeout(400);

      await expect(req.locator('button:has-text("Edit")')).toHaveCount(0);
      await expect(req.locator('text=Add Action Taken')).toHaveCount(0);

      report[`requester-${vp.name}`] = await measure(req);
      await req.screenshot({ path: `${OUT}/ticket-detail-actions-requester-${vp.name}.png`, fullPage: true });
    }

    console.log('LAYOUT_REPORT ' + JSON.stringify(report, null, 2));
  });
});
