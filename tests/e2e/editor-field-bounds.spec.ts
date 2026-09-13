import { test, expect } from "@playwright/test";

const OWNER = {
  email: process.env.SEED_OWNER_EMAIL || "owner@boulderparc.com",
  password: process.env.SEED_OWNER_PASSWORD || "change-me-owner",
};

// The fixture template's "event_title" field, as seeded in fixtures/seed.ts.
const FIELD = { x: 100, y: 100, width: 800, height: 120, maskColor: [255, 179, 71] };
const CANVAS_WIDTH = 1080;
const MAX_CANVAS_WIDTH = 640;
const scale = Math.min(1, MAX_CANVAS_WIDTH / CANVAS_WIDTH);

function colorsClose(a: number[], b: number[], tolerance = 12) {
  return a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
}

/**
 * Regression test for a real production bug: Fabric.js v7 defaults new
 * objects to `originX/originY: "center"` instead of the v5/v6 default of
 * "left"/"top". Every field in the editor was rendering offset by half its
 * own width/height until every object explicitly set left/top origins.
 * This pins the fix by sampling actual canvas pixels at the field's
 * declared top-left corner and just outside it.
 */
test("editable field renders at its declared top-left corner, not offset by half its size", async ({
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

  await expect(page.locator("canvas.lower-canvas").first()).toBeVisible();
  await page.waitForTimeout(600);

  const insideTopLeft = {
    x: Math.round(FIELD.x * scale) + 4,
    y: Math.round(FIELD.y * scale) + 4,
  };
  // Well before the field's top-left corner — if the old center-origin bug
  // reappeared, the mask would extend into this point instead.
  const beforeField = {
    x: Math.max(0, Math.round(FIELD.x * scale) - Math.round((FIELD.width * scale) / 2) - 4),
    y: Math.max(0, Math.round(FIELD.y * scale) - Math.round((FIELD.height * scale) / 2) - 4),
  };

  const pixels = await page.locator("canvas.lower-canvas").first().evaluate(
    (canvas: HTMLCanvasElement, points) => {
      const ctx = canvas.getContext("2d")!;
      return points.map((p) => Array.from(ctx.getImageData(p.x, p.y, 1, 1).data.slice(0, 3)));
    },
    [insideTopLeft, beforeField],
  );

  const [insideColor, beforeColor] = pixels;

  expect(
    colorsClose(insideColor, FIELD.maskColor),
    `expected the field's mask color at its declared top-left corner (${insideTopLeft.x},${insideTopLeft.y}), got rgb(${insideColor})`,
  ).toBe(true);

  expect(
    colorsClose(beforeColor, FIELD.maskColor),
    `field bled into a point well before its declared top-left corner (${beforeField.x},${beforeField.y}) — looks like the center-origin regression`,
  ).toBe(false);
});
