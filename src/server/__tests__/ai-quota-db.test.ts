import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// vi.hoisted so vars available inside vi.mock factory
const { mockUpsert, mockUpdateMany, mockUpdate, mockFindUnique } = vi.hoisted(
  () => ({
    mockUpsert: vi.fn(),
    mockUpdateMany: vi.fn(),
    mockUpdate: vi.fn(),
    mockFindUnique: vi.fn(),
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyAiQuota: {
      upsert: mockUpsert,
      updateMany: mockUpdateMany,
      update: mockUpdate,
      findUnique: mockFindUnique,
    },
  },
}));

import {
  incrementAiQuota,
  decrementAiQuota,
  AI_QUOTA_LIMITS,
} from "@/server/ai-quota";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    userId: "u1",
    date: today(),
    questionsCount: 0,
    materialsCount: 0,
    chatCount: 0,
    practiceGenCount: 0,
    topicGenCount: 0,
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── incrementAiQuota ─────────────────────────────────────────────────────────

describe("incrementAiQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns immediately for by=0", async () => {
    const result = await incrementAiQuota("u1", "questions", 0);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns allowed=true on first use", async () => {
    mockUpsert.mockResolvedValue(makeRow({ questionsCount: 1 }));
    const result = await incrementAiQuota("u1", "questions", 1);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);
    expect(result.limit).toBe(AI_QUOTA_LIMITS.questions);
  });

  it("returns allowed=true on exact limit", async () => {
    mockUpsert.mockResolvedValue(makeRow({ questionsCount: AI_QUOTA_LIMITS.questions }));
    const result = await incrementAiQuota("u1", "questions", 1);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(AI_QUOTA_LIMITS.questions);
  });

  it("rolls back via updateMany and returns allowed=false when over limit", async () => {
    // After bug fix, rollback uses updateMany (with date guard), not update
    const overLimit = AI_QUOTA_LIMITS.questions + 1;
    mockUpsert.mockResolvedValue(makeRow({ questionsCount: overLimit }));
    mockUpdateMany.mockResolvedValue({ count: 1 });

    const result = await incrementAiQuota("u1", "questions", 1);

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(overLimit - 1);
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1" }),
        data: expect.objectContaining({ questionsCount: { decrement: 1 } }),
      }),
    );
  });

  it("resets counters on day boundary — winner path", async () => {
    const yesterday = new Date(today().getTime() - 86_400_000);
    mockUpsert.mockResolvedValue(makeRow({ date: yesterday, questionsCount: 99 }));
    mockUpdateMany.mockResolvedValue({ count: 1 });

    const result = await incrementAiQuota("u1", "questions", 1);

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1" }),
        data: expect.objectContaining({ questionsCount: 1, date: today() }),
      }),
    );
  });

  it("re-reads row on day boundary — loser path, under limit", async () => {
    const yesterday = new Date(today().getTime() - 86_400_000);
    mockUpsert.mockResolvedValue(makeRow({ date: yesterday }));
    mockUpdateMany.mockResolvedValue({ count: 0 });
    mockFindUnique.mockResolvedValue(makeRow({ questionsCount: 3 }));

    const result = await incrementAiQuota("u1", "questions", 1);

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("re-reads row on day boundary — loser path, over limit → rolls back via updateMany", async () => {
    const yesterday = new Date(today().getTime() - 86_400_000);
    mockUpsert.mockResolvedValue(makeRow({ date: yesterday }));
    // first call = reset attempt (loses), second call = rollback decrement
    mockUpdateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    const overLimit = AI_QUOTA_LIMITS.questions + 2;
    mockFindUnique.mockResolvedValue(makeRow({ questionsCount: overLimit }));

    const result = await incrementAiQuota("u1", "questions", 1);

    expect(result.allowed).toBe(false);
    // updateMany called twice: once for reset attempt, once for rollback
    expect(mockUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("works correctly for 'chat' quota kind", async () => {
    mockUpsert.mockResolvedValue(makeRow({ chatCount: 10 }));
    const result = await incrementAiQuota("u1", "chat", 1);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(10);
    expect(result.limit).toBe(AI_QUOTA_LIMITS.chat);
  });

  it("upsert create payload sets only the target kind count", async () => {
    mockUpsert.mockResolvedValue(makeRow({ materialsCount: 1 }));
    await incrementAiQuota("u1", "materials", 1);
    const createData = mockUpsert.mock.calls[0][0].create;
    expect(createData.materialsCount).toBe(1);
    expect(createData.questionsCount).toBe(0);
    expect(createData.chatCount).toBe(0);
  });
});

// ── decrementAiQuota ─────────────────────────────────────────────────────────

describe("decrementAiQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateMany with decrement when by>=1", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await decrementAiQuota("u1", "questions", 1);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        date: expect.any(Date),
        questionsCount: { gt: 0 },
      },
      data: {
        questionsCount: { decrement: 1 },
        updatedAt: expect.any(Date),
      },
    });
  });

  it("skips DB call when by=0", async () => {
    await decrementAiQuota("u1", "questions", 0);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("skips DB call when by<0", async () => {
    await decrementAiQuota("u1", "questions", -1);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("decrements by given amount", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await decrementAiQuota("u1", "chat", 3);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        date: expect.any(Date),
        chatCount: { gt: 0 },
      },
      data: {
        chatCount: { decrement: 3 },
        updatedAt: expect.any(Date),
      },
    });
  });

  it("only decrements if count > 0 (where guard)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    await decrementAiQuota("u1", "questions");

    const whereClause = mockUpdateMany.mock.calls[0][0].where;
    expect(whereClause.questionsCount).toEqual({ gt: 0 });
    expect(whereClause.date).toEqual(expect.any(Date));
  });
});
