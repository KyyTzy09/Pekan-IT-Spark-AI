import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { computeWeeklyItemCounts } from "@/server/learning/weekly";

describe("computeWeeklyItemCounts", () => {
  it("returns 2 questions + 2 materials for weak", () => {
    const r = computeWeeklyItemCounts("weak");
    expect(r.questions).toBe(2);
    expect(r.materials).toBe(2);
  });

  it("returns 3 questions + 1 material for balanced", () => {
    const r = computeWeeklyItemCounts("balanced");
    expect(r.questions).toBe(3);
    expect(r.materials).toBe(1);
  });

  it("returns 4 questions + 1 material for strong", () => {
    const r = computeWeeklyItemCounts("strong");
    expect(r.questions).toBe(4);
    expect(r.materials).toBe(1);
  });

  it("item totals are between 3 and 5", () => {
    for (const s of ["weak", "balanced", "strong"] as const) {
      const r = computeWeeklyItemCounts(s);
      expect(r.questions + r.materials).toBeGreaterThanOrEqual(3);
      expect(r.questions + r.materials).toBeLessThanOrEqual(5);
    }
  });
});
