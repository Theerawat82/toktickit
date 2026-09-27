import { test, expect } from "@playwright/test";

test.describe("Issue 5: Dashboards", () => {
  test("IT Staff sees dashboard, clicks Unassigned, lands on filtered queue", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "staff1@toktickit.com");
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");
    await page.click("text=Dashboard");
    await page.waitForURL("/#dashboard");

    await expect(page.locator("h2").filter({ hasText: "Dashboard" })).toBeVisible();

    const unassignedCountLink = page.locator("a[href='#queue?ownerId=unassigned&status=open']");
    await unassignedCountLink.click();
    await page.waitForURL("/#queue?ownerId=unassigned&status=open");
    
    // We expect the Ticket Queue to render
    await expect(page.locator("strong").filter({ hasText: "Ticket Queue" })).toBeVisible();
  });

  test("IT Staff clicks a Recently Updated row, lands on Ticket Detail", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "staff1@toktickit.com");
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");
    await page.click("text=Dashboard");
    await page.waitForURL("/#dashboard");

    await expect(page.locator("h2").filter({ hasText: "Dashboard" })).toBeVisible();

    // Check recently updated list
    const firstRecentLink = page.locator("a[href^='#ticket/']").first();
    const href = await firstRecentLink.getAttribute("href");
    await firstRecentLink.click();
    
    await page.waitForURL(`/${href}`);
    await expect(page.locator("strong").filter({ hasText: "Ticket Information" })).toBeVisible();
  });

  test("Requester (with tickets) sees own dashboard, clicks My Open Tickets", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "req1@toktickit.com");
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");
    await page.click("text=Dashboard");
    await page.waitForURL("/#dashboard");

    await expect(page.locator("h2").filter({ hasText: "My Dashboard" })).toBeVisible();

    const myOpenLink = page.locator("a[href='#mytickets?status=open']");
    await myOpenLink.click();
    await page.waitForURL("/#mytickets?status=open");
    
    await expect(page.locator("strong").filter({ hasText: "My Tickets" })).toBeVisible();
  });

  test("Requester (zero-ticket seed user) sees empty states, no crash", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "req2@toktickit.com");
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");
    await page.click("text=Dashboard");
    await page.waitForURL("/#dashboard");

    await expect(page.locator("h2").filter({ hasText: "My Dashboard" })).toBeVisible();
    await expect(page.getByText("No recently updated tickets.")).toBeVisible();
    await expect(page.getByText("No recently resolved tickets.")).toBeVisible();
  });

  test("Administrator sees staff dashboard with user-account counts", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "admin@toktickit.com");
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");
    await page.click("text=Dashboard");
    await page.waitForURL("/#dashboard");

    await expect(page.locator("h2").filter({ hasText: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Active Users:", { exact: true })).toBeVisible();
    await expect(page.getByText("Inactive Users:", { exact: true })).toBeVisible();
  });
});
