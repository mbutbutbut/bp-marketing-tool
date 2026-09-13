import { describe, it, expect } from "vitest";
import { resolveSeedEnv } from "@/lib/seed-users";

/**
 * Regression test for a real production bug: Vercel auto-synced
 * `.env.example` variable NAMES with empty string values, and the seed
 * script originally used `??` for its fallback. `??` only falls back on
 * null/undefined, so an empty string silently passed through and created
 * a user with `email: ""`. This pins the fix (`||`) against the real
 * exported helper so a future refactor can't reintroduce the `??` bug.
 */
describe("resolveSeedEnv", () => {
  it("falls back to the default when the env var is undefined", () => {
    expect(resolveSeedEnv(undefined, "owner@boulderparc.com")).toBe(
      "owner@boulderparc.com",
    );
  });

  it("falls back to the default when the env var is an empty string", () => {
    expect(resolveSeedEnv("", "owner@boulderparc.com")).toBe(
      "owner@boulderparc.com",
    );
  });

  it("uses the env var when it is actually set", () => {
    expect(resolveSeedEnv("real-owner@boulderparc.com", "owner@boulderparc.com")).toBe(
      "real-owner@boulderparc.com",
    );
  });
});
