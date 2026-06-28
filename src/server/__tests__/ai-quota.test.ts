import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  AI_QUOTA_LIMITS,
  canIncrementQuota,
  getQuotaResetBoundary,
} from "@/server/ai-quota";

describe("canIncrementQuota", () => {
  it("allows increment when under limit", () => {
    expect(
      canIncrementQuota(
        {
          questionsCount: 5,
          materialsCount: 2,
          chatCount: 0,
          practiceGenCount: 0,
          topicGenCount: 0,
        },
        "questions",
        1,
      ),
    ).toBe(true);
  });

  it("rejects increment when at limit", () => {
    expect(
      canIncrementQuota(
        {
          questionsCount: 20,
          materialsCount: 2,
          chatCount: 0,
          practiceGenCount: 0,
          topicGenCount: 0,
        },
        "questions",
        1,
      ),
    ).toBe(false);
  });

  it("rejects increment when adding would exceed limit", () => {
    expect(
      canIncrementQuota(
        {
          questionsCount: 18,
          materialsCount: 0,
          chatCount: 0,
          practiceGenCount: 0,
          topicGenCount: 0,
        },
        "questions",
        5,
      ),
    ).toBe(false);
  });

  it("uses separate limits per kind", () => {
    expect(
      canIncrementQuota(
        {
          questionsCount: 20,
          materialsCount: 0,
          chatCount: 0,
          practiceGenCount: 0,
          topicGenCount: 0,
        },
        "materials",
        1,
      ),
    ).toBe(true);
  });

  it("handles null quota (no row yet)", () => {
    expect(canIncrementQuota(null, "questions", 1)).toBe(true);
  });

  it("AI_QUOTA_LIMITS exports correct values", () => {
    expect(AI_QUOTA_LIMITS.questions).toBe(20);
    expect(AI_QUOTA_LIMITS.materials).toBe(5);
  });
});

describe("getQuotaResetBoundary", () => {
  it("returns start of next day in UTC", () => {
    const d = new Date("2026-06-20T15:30:00Z");
    const boundary = getQuotaResetBoundary(d);
    expect(boundary.toISOString()).toBe("2026-06-21T00:00:00.000Z");
  });

  it("handles end of month rollover", () => {
    const d = new Date("2026-06-30T23:59:59Z");
    const boundary = getQuotaResetBoundary(d);
    expect(boundary.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});
