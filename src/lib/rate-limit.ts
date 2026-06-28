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

    // BUG-19 FIX: Use atomic conditional update to prevent race on window reset.
    // If window expired, use raw query to atomically reset to 1.
    const record = await prisma.$queryRaw<[{ count: number; reset_at: Date }]>`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${new Date(now + WINDOW_MS)})
      ON CONFLICT (key) DO UPDATE
        SET count = CASE
          WHEN rate_limits.reset_at < ${new Date(now)} THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at < ${new Date(now)} THEN ${new Date(now + WINDOW_MS)}
          ELSE rate_limits.reset_at
        END
      RETURNING count, reset_at
    `;
    const result = record[0];
    const resetAt = new Date(result.reset_at).getTime();

    if (result.count > MAX_ATTEMPTS) {
      attempts.set(key, { count: result.count, resetAt });
      return false;
    }

    attempts.set(key, { count: result.count, resetAt });
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
    .then(({ prisma }) =>
      prisma.rateLimit.delete({ where: { key } }).catch(() => {}),
    )
    .catch(() => {});
}

// Prevent memory leak: clean up expired entries every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of attempts) {
        if (now > entry.resetAt) {
          attempts.delete(key);
        }
      }
    },
    30 * 60 * 1000,
  ).unref();
}
