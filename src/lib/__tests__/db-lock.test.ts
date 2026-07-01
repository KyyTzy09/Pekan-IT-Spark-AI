import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    generationLock: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { acquireDbLock, releaseDbLock, isLocked } from "@/lib/db-lock";

const mockLock = prisma.generationLock as any;

describe("acquireDbLock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when lock created successfully", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 1 });
    mockLock.create.mockResolvedValue({ id: "lock-1" });

    const result = await acquireDbLock("user-1", "DAILY");

    expect(result).toBe(true);
    expect(mockLock.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        lockType: "DAILY",
        expiresAt: expect.any(Date),
      },
    });
  });

  it("returns false when lock already exists and is valid (P2002)", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 0 });
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockLock.create.mockRejectedValue(p2002);
    // updateMany returns 0 = lock still valid
    mockLock.updateMany.mockResolvedValue({ count: 0 });

    const result = await acquireDbLock("user-1", "DAILY");

    expect(result).toBe(false);
  });

  it("steals expired lock atomically via updateMany (P2002)", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 0 });
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockLock.create.mockRejectedValue(p2002);
    // updateMany returns 1 = expired lock stolen
    mockLock.updateMany.mockResolvedValue({ count: 1 });

    const result = await acquireDbLock("user-1", "WEEKLY");

    expect(result).toBe(true);
    expect(mockLock.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        lockType: "WEEKLY",
        expiresAt: { lt: expect.any(Date) },
      },
      data: { expiresAt: expect.any(Date) },
    });
  });

  it("returns false on unexpected error (fail closed)", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 0 });
    mockLock.create.mockRejectedValue(new Error("DB connection failed"));

    const result = await acquireDbLock("user-1", "ON_DEMAND");

    expect(result).toBe(false);
  });

  it("cleanup deleteMany swallows its own error silently", async () => {
    mockLock.deleteMany.mockRejectedValue(new Error("cleanup failed"));
    mockLock.create.mockResolvedValue({ id: "lock-1" });

    // Should not throw — cleanup error is .catch(()=>{})
    const result = await acquireDbLock("user-1", "DAILY");
    expect(result).toBe(true);
  });

  it("lock expiresAt is ~5 minutes from now", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 0 });
    mockLock.create.mockResolvedValue({ id: "lock-1" });

    const before = Date.now();
    await acquireDbLock("user-1", "DAILY");
    const after = Date.now();

    const createCall = mockLock.create.mock.calls[0][0];
    const expiresAt = createCall.data.expiresAt.getTime();
    const FIVE_MIN = 5 * 60 * 1000;

    expect(expiresAt).toBeGreaterThanOrEqual(before + FIVE_MIN - 100);
    expect(expiresAt).toBeLessThanOrEqual(after + FIVE_MIN + 100);
  });
});

describe("releaseDbLock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes lock for userId + lockType", async () => {
    mockLock.deleteMany.mockResolvedValue({ count: 1 });

    await releaseDbLock("user-1", "DAILY");

    expect(mockLock.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", lockType: "DAILY" },
    });
  });

  it("swallows DB error silently", async () => {
    mockLock.deleteMany.mockRejectedValue(new Error("DB down"));

    await expect(releaseDbLock("user-1", "DAILY")).resolves.toBeUndefined();
  });
});

describe("isLocked", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when no lock exists", async () => {
    mockLock.findUnique.mockResolvedValue(null);

    const result = await isLocked("user-1", "DAILY");

    expect(result).toBe(false);
  });

  it("returns true when lock exists and not expired", async () => {
    const future = new Date(Date.now() + 60_000);
    mockLock.findUnique.mockResolvedValue({ id: "lock-1", expiresAt: future });

    const result = await isLocked("user-1", "DAILY");

    expect(result).toBe(true);
  });

  it("returns false and cleans up when lock is expired", async () => {
    const past = new Date(Date.now() - 60_000);
    mockLock.findUnique.mockResolvedValue({ id: "lock-1", expiresAt: past });
    mockLock.deleteMany.mockResolvedValue({ count: 1 });

    const result = await isLocked("user-1", "DAILY");

    expect(result).toBe(false);
    expect(mockLock.deleteMany).toHaveBeenCalledWith({
      where: { id: "lock-1" },
    });
  });

  it("cleanup deleteMany swallows error when lock already deleted by another request", async () => {
    const past = new Date(Date.now() - 60_000);
    mockLock.findUnique.mockResolvedValue({ id: "lock-1", expiresAt: past });
    mockLock.deleteMany.mockRejectedValue(new Error("not found"));

    // Should not throw
    const result = await isLocked("user-1", "DAILY");
    expect(result).toBe(false);
  });
});
