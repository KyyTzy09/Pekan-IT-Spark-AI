import { prisma } from "@/lib/prisma";

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Try to acquire a database-backed generation lock.
 * Returns true if lock acquired, false if already locked.
 * Uses unique constraint to prevent race conditions on Vercel serverless.
 */
export async function acquireDbLock(
  userId: string,
  lockType: "DAILY" | "WEEKLY" | "ON_DEMAND",
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  try {
    // Clean up expired locks first
    await prisma.generationLock
      .deleteMany({
        where: { expiresAt: { lt: now } },
      })
      .catch(() => {});

    // Try to create lock - will fail if unique constraint violated
    await prisma.generationLock.create({
      data: {
        userId,
        lockType,
        expiresAt,
      },
    });
    return true;
  } catch (err: any) {
    // P2002 = unique constraint violation = lock already exists
    if (err?.code === "P2002") {
      // BUG-14 FIX: Use atomic update to prevent race condition on lock stealing.
      // If lock is expired, atomically update it — only one request can succeed.
      const updated = await prisma.generationLock.updateMany({
        where: {
          userId,
          lockType,
          expiresAt: { lt: now },
        },
        data: { expiresAt },
      });
      if (updated.count > 0) {
        return true; // Lock was expired and we claimed it
      }
      return false; // Lock is still valid
    }
    // Other errors - fail closed: deny lock to prevent duplicate generation
    console.error("[DB_LOCK] Unexpected error:", err);
    return false;
  }
}

/**
 * Release a database-backed generation lock.
 */
export async function releaseDbLock(
  userId: string,
  lockType: "DAILY" | "WEEKLY" | "ON_DEMAND",
): Promise<void> {
  try {
    await prisma.generationLock.deleteMany({
      where: { userId, lockType },
    });
  } catch {
    // Ignore errors on release
  }
}

/**
 * Check if a lock exists (for deduplication checks)
 */
export async function isLocked(
  userId: string,
  lockType: "DAILY" | "WEEKLY" | "ON_DEMAND",
): Promise<boolean> {
  const now = new Date();
  const lock = await prisma.generationLock.findUnique({
    where: { userId_lockType: { userId, lockType } },
  });
  if (!lock) return false;
  if (lock.expiresAt < now) {
    // Expired, clean up — pakai deleteMany supaya tidak throw kalau sudah dihapus request lain
    await prisma.generationLock
      .deleteMany({ where: { id: lock.id } })
      .catch(() => {});
    return false;
  }
  return true;
}
