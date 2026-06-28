import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import { computeDifficultyDistribution } from "@/server/ai/curriculum";

describe("computeDifficultyDistribution", () => {
  it("STRUGGLING (mastery 0.2, count 10): expects easy=5, medium=3, hard=2", () => {
    const result = computeDifficultyDistribution(0.2, 10);
    expect(result).toEqual({ easy: 5, medium: 3, hard: 2 });
  });

  it("LEARNING (mastery 0.5, count 10): expects easy=2, medium=5, hard=3", () => {
    const result = computeDifficultyDistribution(0.5, 10);
    expect(result).toEqual({ easy: 2, medium: 5, hard: 3 });
  });

  it("MASTERED (mastery 0.8, count 10): expects easy=2, medium=3, hard=5", () => {
    const result = computeDifficultyDistribution(0.8, 10);
    expect(result).toEqual({ easy: 2, medium: 3, hard: 5 });
  });

  it("Small count (mastery 0.5, count 1): expects easy=1, medium=0, hard=0", () => {
    const result = computeDifficultyDistribution(0.5, 1);
    expect(result).toEqual({ easy: 1, medium: 0, hard: 0 });
  });

  it("Small count (mastery 0.5, count 2): expects easy=1, medium=1, hard=0", () => {
    const result = computeDifficultyDistribution(0.5, 2);
    expect(result).toEqual({ easy: 1, medium: 1, hard: 0 });
  });

  it("Small count (mastery 0.2, count 3): expects each tier >= 1", () => {
    const result = computeDifficultyDistribution(0.2, 3);
    expect(result).toEqual({ easy: 1, medium: 1, hard: 1 });
  });

  it("Zero count returns zeros", () => {
    const result = computeDifficultyDistribution(0.5, 0);
    expect(result).toEqual({ easy: 0, medium: 0, hard: 0 });
  });
});
