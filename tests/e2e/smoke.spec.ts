import { test, expect } from "@playwright/test";

const OWNER = {
  email: process.env.SEED_OWNER_EMAIL || "owner@boulderparc.com",
  password: process.env.SEED_OWNER_PASSWORD || "change-me-owner",
};

/**
 * Phase 0 deploy gate: the one journey that must never break —
 * an Owner can log in, open a template's editor, and export a PNG.
 * This is the smoke test referenced in the QA plan's Phase 0.
 */
test("owner can log in, open the editor, and export a PNG", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', OWNER.email);
  await page.fill('input[type="password"]', OWNER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app", { timeout: 15_000 });

  await page.click("text=E2E Fixture Poster");
  await page.waitForURL("**/app/templates/**", { timeout: 10_000 });
  await page.click("text=Open editor");
  await page.waitForURL("**/edit/**", { timeout: 10_000 });

  // Fields render on the canvas before we try to export.
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForTimeout(500);

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10_000 }),
    page.click('button:has-text("PNG")'),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
