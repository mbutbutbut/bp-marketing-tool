import { describe, it, expect } from "vitest";
import { pointsPerPxForDpi } from "@/lib/dpi";

describe("pointsPerPxForDpi", () => {
  it("converts 300 DPI (print) to points-per-px", () => {
    expect(pointsPerPxForDpi(300)).toBeCloseTo(72 / 300);
  });

  it("converts 72 DPI (screen) to 1:1", () => {
    expect(pointsPerPxForDpi(72)).toBe(1);
  });

  it("falls back to 72 DPI for missing input", () => {
    expect(pointsPerPxForDpi(undefined)).toBe(1);
    expect(pointsPerPxForDpi(null)).toBe(1);
  });

  it("falls back to 72 DPI for zero/negative input instead of producing a zero-size page", () => {
    expect(pointsPerPxForDpi(0)).toBe(1);
    expect(pointsPerPxForDpi(-300)).toBe(1);
  });
});
