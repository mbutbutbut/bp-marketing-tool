import { describe, it, expect } from "vitest";
import { computeCanvasScale, scaleField } from "@/lib/scale-canvas";

describe("computeCanvasScale", () => {
  it("scales proportionally when aspect ratio is unchanged", () => {
    // 1080x1080 (IG post) -> 2160x2160 (2x export)
    const scale = computeCanvasScale(1080, 1080, 2160, 2160);
    expect(scale.scaleX).toBe(2);
    expect(scale.scaleY).toBe(2);
    expect(scale.fontScale).toBe(2);
  });

  it("uses the geometric mean for font scale across a changed aspect ratio", () => {
    // Letter (2550x3300) -> IG Story (1080x1920): axes scale differently
    const scale = computeCanvasScale(2550, 3300, 1080, 1920);
    expect(scale.scaleX).toBeCloseTo(1080 / 2550);
    expect(scale.scaleY).toBeCloseTo(1920 / 3300);
    // font scale must sit strictly between the two axis scales, not just copy one
    const lower = Math.min(scale.scaleX, scale.scaleY);
    const upper = Math.max(scale.scaleX, scale.scaleY);
    expect(scale.fontScale).toBeGreaterThan(lower);
    expect(scale.fontScale).toBeLessThan(upper);
  });
});

describe("scaleField", () => {
  it("scales position, size, and font size together, not stretched independently", () => {
    const field = { x: 100, y: 200, width: 300, height: 50, fontSize: 24 };
    const scale = computeCanvasScale(1000, 1000, 500, 500); // half size, same aspect
    const scaled = scaleField(field, scale);

    expect(scaled.x).toBe(50);
    expect(scaled.y).toBe(100);
    expect(scaled.width).toBe(150);
    expect(scaled.height).toBe(25);
    expect(scaled.fontSize).toBe(12);
  });

  it("never produces a field outside the target canvas bounds for a same-origin field", () => {
    const field = { x: 0, y: 0, width: 1080, height: 1080, fontSize: 40 };
    const scale = computeCanvasScale(1080, 1080, 1080, 1920); // post -> story
    const scaled = scaleField(field, scale);

    expect(scaled.x).toBeGreaterThanOrEqual(0);
    expect(scaled.y).toBeGreaterThanOrEqual(0);
    expect(scaled.x + scaled.width).toBeLessThanOrEqual(1080 + 0.001);
    expect(scaled.y + scaled.height).toBeLessThanOrEqual(1920 + 0.001);
  });
});
