import { test, expect } from "@playwright/test";

const EDITOR = {
  email: process.env.SEED_EDITOR_EMAIL || "editor@boulderparc.com",
  password: process.env.SEED_EDITOR_PASSWORD || "change-me-editor",
};

/**
 * Regression test for a real UI bug found by screenshotting the build at
 * phone width: the fill/edit canvas was sized from a hardcoded
 * MAX_CANVAS_WIDTH constant instead of its container, so on a narrow
 * viewport the (square) canvas rendered at its full desktop size and got
 * horizontally clipped — a phone user saw a tall sliver of the design
 * instead of the whole thing. Pins the fix: the canvas element's rendered
 * width must always match its container's width, at any viewport.
 */
test("fill canvas scales to fit its container on a phone-width viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/login");
  await page.fill('input[type="email"]', EDITOR.email);
  await page.fill('input[type="password"]', EDITOR.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !location.pathname.includes("/login"), {
    timeout: 15_000,
  });

  await page.goto("/fill");
  await page
    .locator("li", { hasText: "E2E Fixture Poster" })
    .getByText("Fill in content")
    .click();
  await page.waitForURL("**/fill/**", { timeout: 10_000 });
  await page.waitForTimeout(700);

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();

  const measurements = await canvas.evaluate((el: HTMLCanvasElement) => {
    const canvasBox = el.getBoundingClientRect();
    const containerBox = el.parentElement!.getBoundingClientRect();
    return {
      canvasWidth: canvasBox.width,
      containerWidth: containerBox.width,
    };
  });

  expect(
    Math.abs(measurements.canvasWidth - measurements.containerWidth),
    `canvas (${measurements.canvasWidth}px) should match its container (${measurements.containerWidth}px) instead of overflowing it`,
  ).toBeLessThan(2);
});
