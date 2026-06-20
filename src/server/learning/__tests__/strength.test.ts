import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  computeGrowthTrend,
  computeMasteryAverage,
  distributeChallengeSubjects,
  pickChallengeSubjectIds,
} from "@/server/learning/strength";

describe("computeMasteryAverage", () => {
  it("returns 0 for empty input", () => {
    expect(computeMasteryAverage([])).toBe(0);
  });

  it("returns the value for single item", () => {
    expect(computeMasteryAverage([0.5])).toBe(0.5);
  });

  it("computes the arithmetic mean", () => {
    expect(computeMasteryAverage([0.2, 0.4, 0.6, 0.8])).toBeCloseTo(0.5);
  });

  it("handles 0 and 1 boundary values", () => {
    expect(computeMasteryAverage([0, 1])).toBeCloseTo(0.5);
  });
});

describe("computeGrowthTrend", () => {
  it("returns 0 when both windows are empty", () => {
    expect(computeGrowthTrend([], [])).toBe(0);
  });

  it("returns 0 when one window is empty", () => {
    expect(computeGrowthTrend([0.5], [])).toBe(0);
    expect(computeGrowthTrend([], [0.5])).toBe(0);
  });

  it("returns positive delta for growth", () => {
    expect(computeGrowthTrend([0.7, 0.8], [0.5, 0.4])).toBeCloseTo(0.3);
  });

  it("returns negative delta for decline", () => {
    expect(computeGrowthTrend([0.3, 0.2], [0.5, 0.6])).toBeCloseTo(-0.3);
  });

  it("returns 0 for flat trend", () => {
    expect(computeGrowthTrend([0.5, 0.5], [0.5, 0.5])).toBe(0);
  });
});

describe("pickChallengeSubjectIds", () => {
  const makeProfile = (
    overrides: Partial<{
      challengeSubjectIds: string[];
      focusedSubjects: string[];
    }>,
  ) => ({
    challengeSubjectIds: [],
    focusedSubjects: [],
    ...overrides,
  });

  it("uses challengeSubjectIds first", () => {
    const result = pickChallengeSubjectIds(
      makeProfile({
        challengeSubjectIds: ["a", "b"],
        focusedSubjects: ["c", "d"],
      }),
      ["e", "f", "g", "h"],
    );
    expect(result).toEqual(["a", "b"]);
  });

  it("falls back to focusedSubjects when challengeSubjectIds empty", () => {
    const result = pickChallengeSubjectIds(
      makeProfile({ focusedSubjects: ["c", "d"] }),
      ["e", "f", "g", "h"],
    );
    expect(result).toEqual(["c", "d"]);
  });

  it("falls back to national defaults when both empty", () => {
    const result = pickChallengeSubjectIds(makeProfile({}), [
      "e",
      "f",
      "g",
      "h",
    ]);
    expect(result).toEqual(["e", "f", "g", "h"]);
  });

  it("caps to max 4 subjects", () => {
    const result = pickChallengeSubjectIds(
      makeProfile({ challengeSubjectIds: ["a", "b", "c", "d", "e"] }),
      ["x", "y", "z"],
    );
    expect(result).toEqual(["a", "b", "c", "d"]);
  });

  it("caps national fallback to 4", () => {
    const result = pickChallengeSubjectIds(makeProfile({}), [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
    expect(result.length).toBe(4);
  });
});

describe("distributeChallengeSubjects", () => {
  it("returns empty for no subjects", () => {
    expect(distributeChallengeSubjects([], 4)).toEqual([]);
  });

  it("duplicates 1 subject 4 times", () => {
    expect(distributeChallengeSubjects(["A"], 4)).toEqual(["A", "A", "A", "A"]);
  });

  it("round-robins 2 subjects evenly", () => {
    expect(distributeChallengeSubjects(["A", "B"], 4)).toEqual(["A", "B", "A", "B"]);
  });

  it("round-robins 3 subjects with wrap", () => {
    expect(distributeChallengeSubjects(["A", "B", "C"], 4)).toEqual(["A", "B", "C", "A"]);
  });

  it("returns exact match for 4 subjects", () => {
    expect(distributeChallengeSubjects(["A", "B", "C", "D"], 4)).toEqual(["A", "B", "C", "D"]);
  });

  it("returns empty when total is 0", () => {
    expect(distributeChallengeSubjects(["A", "B"], 0)).toEqual([]);
  });
});
