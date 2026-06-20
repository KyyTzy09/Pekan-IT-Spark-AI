import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { computeMixForSubject } from "@/server/learning/mix";

describe("computeMixForSubject", () => {
  it("returns Weak+Stagnant for mastery < 0.4", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.2,
      growthTrend: 0.0,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(2);
    expect(mix.materials).toBe(2);
    expect(mix.reflections).toBe(1);
    expect(mix.questionDifficulty).toBe("EASY");
  });

  it("returns Weak+Stagnant when mastery is low AND growth is stagnant", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.3,
      growthTrend: 0.01,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(2);
    expect(mix.questionDifficulty).toBe("EASY");
  });

  it("returns Weak+Growing for mastery < 0.4 with growth >= 0.05", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.3,
      growthTrend: 0.08,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(3);
    expect(mix.materials).toBe(1);
    expect(mix.reflections).toBe(1);
    expect(mix.questionDifficulty).toBe("MEDIUM");
  });

  it("returns Balanced for mastery 0.4-0.7", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.5,
      growthTrend: 0.0,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(3);
    expect(mix.materials).toBe(1);
    expect(mix.reflections).toBe(1);
    expect(mix.questionDifficulty).toBe("MEDIUM");
  });

  it("returns Strong+Stagnant for mastery > 0.7 with growth < 0.02", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.8,
      growthTrend: 0.0,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(3);
    expect(mix.materials).toBe(1);
    expect(mix.reflections).toBe(1);
    expect(mix.questionDifficulty).toBe("HARD");
  });

  it("returns Strong+Growing for mastery > 0.7 with growth >= 0.05", () => {
    const mix = computeMixForSubject({
      avgMastery: 0.85,
      growthTrend: 0.1,
      hasAttempts: true,
    });
    expect(mix.questions).toBe(4);
    expect(mix.materials).toBe(1);
    expect(mix.reflections).toBe(0);
    expect(mix.questionDifficulty).toBe("HARD");
  });

  it("returns Weak+Stagnant when no attempts yet (conservative)", () => {
    const mix = computeMixForSubject({
      avgMastery: 0,
      growthTrend: 0,
      hasAttempts: false,
    });
    expect(mix.questions).toBe(2);
    expect(mix.materials).toBe(2);
    expect(mix.reflections).toBe(1);
    expect(mix.questionDifficulty).toBe("EASY");
  });

  it("total item count is between 4 and 5", () => {
    const states = [
      { avgMastery: 0.1, growthTrend: 0.0, hasAttempts: true },
      { avgMastery: 0.3, growthTrend: 0.1, hasAttempts: true },
      { avgMastery: 0.5, growthTrend: 0.0, hasAttempts: true },
      { avgMastery: 0.8, growthTrend: 0.0, hasAttempts: true },
      { avgMastery: 0.9, growthTrend: 0.1, hasAttempts: true },
    ];
    for (const state of states) {
      const mix = computeMixForSubject(state);
      const total = mix.questions + mix.materials + mix.reflections;
      expect(total).toBeGreaterThanOrEqual(4);
      expect(total).toBeLessThanOrEqual(5);
    }
  });

  it("maps bloom taxonomy to expected level per state", () => {
    expect(
      computeMixForSubject({
        avgMastery: 0.2,
        growthTrend: 0,
        hasAttempts: true,
      }).bloomTaxonomy,
    ).toBe("UNDERSTAND");
    expect(
      computeMixForSubject({
        avgMastery: 0.5,
        growthTrend: 0,
        hasAttempts: true,
      }).bloomTaxonomy,
    ).toBe("APPLY");
    expect(
      computeMixForSubject({
        avgMastery: 0.8,
        growthTrend: 0.1,
        hasAttempts: true,
      }).bloomTaxonomy,
    ).toBe("ANALYZE");
  });
});
