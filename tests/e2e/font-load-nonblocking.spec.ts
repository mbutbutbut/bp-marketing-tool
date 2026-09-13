import { test } from "@playwright/test";

const EDITOR = {
  email: process.env.SEED_EDITOR_EMAIL || "editor@boulderparc.com",
  password: process.env.SEED_EDITOR_PASSWORD || "change-me-editor",
};

// The fixture template's "event_title" field, as seeded in fixtures/seed.ts.
const FIELD = { x: 100, y: 100, maskColor: [255, 179, 71] };
const CANVAS_WIDTH = 1080;
const MAX_CANVAS_WIDTH = 640;
const scale = Math.min(1, MAX_CANVAS_WIDTH / CANVAS_WIDTH);

/**
 * Regression test for a real bug introduced (and caught) while fixing the
 * silent font-load-failure gap: an earlier version of the fix awaited the
 * Google Fonts network request before creating each field, which is fine
 * on a fast connection but means field rendering — and therefore the
 * whole editor becoming usable — hangs for as long as that request takes
 * to fail (observed: 10+ seconds to a connection reset in a restricted
 * network). Font loading must be fire-and-forget: fields render
 * immediately with whatever font is available, and a failure is
 * reported later via a banner, never by blocking. Sampling the
 * background canvas color (e.g. pixel 0,0) would not catch this — that
 * paints synchronously at canvas construction regardless of field
 * loading — so this samples an actual field's mask, which only appears
 * once the (previously font-load-gated) per-field loop runs.
 */
test("fields render immediately regardless of font-load network speed", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', EDITOR.email);
  await page.fill('input[type="password"]', EDITOR.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !location.pathname.includes("/login"), {
    timeout: 15_000,
  });

  await page.goto("/fill", { waitUntil: "domcontentloaded" });
  await page
    .locator("li", { hasText: "E2E Fixture Poster" })
    .getByText("Fill in content")
    .click();
  await page.waitForURL("**/fill/**", { timeout: 10_000 });

  const point = {
    x: Math.round(FIELD.x * scale) + 4,
    y: Math.round(FIELD.y * scale) + 4,
  };

  // Not networkidle — a hung font request would delay that wait
  // condition itself and defeat the point of this test. A tight budget:
  // this should take well under a second on any real connection speed.
  await page.waitForFunction(
    ({ x, y, expected }) => {
      const canvas = document.querySelector("canvas.lower-canvas");
      if (!canvas) return false;
      const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
      const px = Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
      return px.every((v, i) => Math.abs(v - expected[i]) <= 12);
    },
    { x: point.x, y: point.y, expected: FIELD.maskColor },
    { timeout: 3_000 },
  );
});
