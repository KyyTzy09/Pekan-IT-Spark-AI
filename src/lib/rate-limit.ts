/**
 * Rate limiter — database-backed for serverless compatibility.
 *
 * Uses a simple key-based approach: store attempt counts in memory
 * with a fallback to Prisma for persistence across cold starts.
 *
 * For production at scale, replace with Redis/Upstash.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

// In-memory cache for hot path (avoids DB round-trip for same instance)
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true; // allowed
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false; // blocked
  }

  entry.count++;
  return true; // allowed
}

/**
 * Async version that also checks the database for cross-instance consistency.
 * Use this for critical paths (login, register) where serverless multi-instance matters.
 */
export async function checkRateLimitAsync(key: string): Promise<boolean> {
  // Check in-memory first (fast path)
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && now <= entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    // BUG-3 FIX: Atomic increment within upsert to prevent race condition.
    // If window expired, reset count to 1. Otherwise, increment and check.
    const record = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now + WINDOW_MS) },
      update: {
        // If window expired, Prisma will still execute this update.
        // We handle the reset case below by checking the timestamp.
        count: { increment: 1 },
      },
      select: { count: true, resetAt: true },
    });

    // If the window had expired before the increment, reset to 1
    if (record.resetAt.getTime() < now) {
      const _reset = await prisma.rateLimit.update({
        where: { key },
        data: { count: 1, resetAt: new Date(now + WINDOW_MS) },
        select: { count: true },
      });
      attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    // Check if the atomically-incremented count exceeds the limit
    if (record.count > MAX_ATTEMPTS) {
      attempts.set(key, { count: record.count, resetAt: record.resetAt.getTime() });
      return false;
    }

    attempts.set(key, { count: record.count, resetAt: record.resetAt.getTime() });
    return true;
  } catch {
    // DB unavailable — fall back to in-memory only
    return checkRateLimit(key);
  }
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
  // Also clear from DB (fire-and-forget)
  import("@/lib/prisma")
    .then(({ prisma }) => prisma.rateLimit.delete({ where: { key } }).catch(() => {}))
    .catch(() => {});
}

// Prevent memory leak: clean up expired entries every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attempts) {
      if (now > entry.resetAt) {
        attempts.delete(key);
      }
    }
  }, 30 * 60 * 1000).unref();
}
