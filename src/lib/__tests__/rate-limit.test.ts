import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock prisma with $queryRaw and rateLimit
const mockQueryRaw = vi.fn();
const mockRateLimitDelete = vi.fn();
const mockRateLimitDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    rateLimit: {
      delete: mockRateLimitDelete,
      deleteMany: mockRateLimitDeleteMany,
    },
  },
}));

import { checkRateLimit, checkRateLimitAsync, clearRateLimit } from "@/lib/rate-limit";

// Access internal attempts map by re-importing after clearing module
// We test behavior, not internals directly

describe("checkRateLimit (in-memory)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state by clearing all keys
    // We use unique keys per test to avoid bleed
  });

  it("allows first attempt", () => {
    const result = checkRateLimit("test-key-ratelimit-1");
    expect(result).toBe(true);
  });

  it("allows up to MAX_ATTEMPTS (5)", () => {
    const key = "test-key-ratelimit-max";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key)).toBe(true);
    }
  });

  it("blocks on 6th attempt", () => {
    const key = "test-key-ratelimit-block";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key)).toBe(false);
  });

  it("resets after window expires", () => {
    const key = "test-key-ratelimit-reset";
    // Fill up
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key)).toBe(false);

    // Manually expire by calling with a mocked date — 
    // instead, use unique key with forced-expired state via time mock
    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000); // 16 min > 15 min window

    expect(checkRateLimit(key)).toBe(true);
    vi.useRealTimers();
  });
});

describe("checkRateLimitAsync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows when DB returns count <= MAX_ATTEMPTS", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 3, reset_at: new Date(Date.now() + 900_000) }]);

    const result = await checkRateLimitAsync("async-key-1");

    expect(result).toBe(true);
    expect(mockQueryRaw).toHaveBeenCalled();
  });

  it("blocks when DB returns count > MAX_ATTEMPTS", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 6, reset_at: new Date(Date.now() + 900_000) }]);

    const result = await checkRateLimitAsync("async-key-2");

    expect(result).toBe(false);
  });

  it("falls back to in-memory when DB throws", async () => {
    mockQueryRaw.mockRejectedValue(new Error("DB down"));

    // Fresh key, so in-memory allows
    const result = await checkRateLimitAsync("async-key-fallback");

    expect(result).toBe(true);
  });

  it("uses atomic upsert SQL with ON CONFLICT", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 1, reset_at: new Date(Date.now() + 900_000) }]);

    await checkRateLimitAsync("async-key-sql-check");

    const call = mockQueryRaw.mock.calls[0];
    // Tagged template literal — first arg is TemplateStringsArray
    const sqlParts = call[0];
    const fullSql = Array.isArray(sqlParts) ? sqlParts.join("") : String(sqlParts);
    expect(fullSql).toContain("ON CONFLICT");
    expect(fullSql).toContain("RETURNING");
  });
});

describe("clearRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears in-memory entry (allows subsequent calls)", () => {
    const key = "clear-test-key";
    // Fill up
    for (let i = 0; i < 5; i++) checkRateLimit(key);
    expect(checkRateLimit(key)).toBe(false);

    clearRateLimit(key);

    // After clear, in-memory resets
    expect(checkRateLimit(key)).toBe(true);
  });

  it("calls DB deleteMany fire-and-forget", async () => {
    mockRateLimitDeleteMany.mockResolvedValue({ count: 1 });

    clearRateLimit("clear-db-key");

    // Fire-and-forget, wait a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRateLimitDeleteMany).toHaveBeenCalledWith({
      where: { key: "clear-db-key" },
    });
  });
});
