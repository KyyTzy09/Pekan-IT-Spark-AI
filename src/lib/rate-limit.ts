/**
 * Sederhana in-memory rate limiter.
 * Tidak persisten (hilang saat server restart) — cukup untuk mencegah brute-force ringan.
 * Untuk production skala besar, ganti pakai Redis/Upstash.
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

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

export function clearRateLimit(key: string): void {
  attempts.delete(key);
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
