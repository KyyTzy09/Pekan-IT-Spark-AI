import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import { computeDifficultyDistribution } from "@/server/ai/curriculum";

describe("computeDifficultyDistribution", () => {
  it("STRUGGLING (mastery 0.2, count 10): expects easy=6, medium=3, hard=1", () => {
    const result = computeDifficultyDistribution(0.2, 10);
    expect(result).toEqual({ easy: 6, medium: 3, hard: 1 });
  });

  it("LEARNING (mastery 0.5, count 10): expects easy=2, medium=5, hard=3", () => {
    const result = computeDifficultyDistribution(0.5, 10);
    expect(result).toEqual({ easy: 2, medium: 5, hard: 3 });
  });

  it("MASTERED (mastery 0.8, count 10): expects easy=1, medium=3, hard=6", () => {
    const result = computeDifficultyDistribution(0.8, 10);
    expect(result).toEqual({ easy: 1, medium: 3, hard: 6 });
  });

  it("Small counts (mastery 0.2, count 3): total=3, easy>=1", () => {
    const result = computeDifficultyDistribution(0.2, 3);
    expect(result.easy + result.medium + result.hard).toBe(3);
    expect(result.easy).toBeGreaterThanOrEqual(1);
    expect(result.medium).toBeGreaterThanOrEqual(1);
    expect(result.hard).toBeGreaterThanOrEqual(1);
  });
});
