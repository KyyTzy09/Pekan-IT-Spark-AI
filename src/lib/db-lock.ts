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
    // Clean up expired locks first (fire-and-forget)
    prisma.generationLock
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
      // Check if the existing lock is expired
      const existing = await prisma.generationLock.findUnique({
        where: { userId_lockType: { userId, lockType } },
      });
      if (existing && existing.expiresAt < now) {
        // Lock expired, steal it
        await prisma.generationLock.update({
          where: { id: existing.id },
          data: { expiresAt },
        });
        return true;
      }
      return false;
    }
    // Other errors - log and allow generation (fail-open)
    console.error("[DB_LOCK] Unexpected error:", err);
    return true;
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
    // Expired, clean up
    await prisma.generationLock
      .delete({ where: { id: lock.id } })
      .catch(() => {});
    return false;
  }
  return true;
}
