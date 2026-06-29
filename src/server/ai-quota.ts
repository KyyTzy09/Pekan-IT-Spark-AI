import "server-only";

import { prisma } from "@/lib/prisma";

export const AI_QUOTA_LIMITS = {
  questions: 20,
  materials: 5,
  chat: 50,
  practiceGen: 2,
  topicGen: 2,
} as const;

export type AiQuotaKind = keyof typeof AI_QUOTA_LIMITS;

export type AiQuotaSnapshot = {
  questionsCount: number;
  materialsCount: number;
  chatCount: number;
  practiceGenCount: number;
  topicGenCount: number;
};

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function getQuotaResetBoundary(now: Date): Date {
  const start = startOfUtcDay(now);
  return new Date(start.getTime() + 86_400_000);
}

export function canIncrementQuota(
  quota: AiQuotaSnapshot | null,
  kind: AiQuotaKind,
  by: number,
): boolean {
  const limit = AI_QUOTA_LIMITS[kind];
  const current = quota ? quota[`${kind}Count` as const] : 0;
  return current + by <= limit;
}

export async function decrementAiQuota(
  userId: string,
  kind: AiQuotaKind,
  by = 1,
): Promise<void> {
  if (by < 1) return;
  const countKey = `${kind}Count` as const;

  // Atomic decrement — single query, no TOCTOU.
  // No date guard: userId is @unique, so exactly one row per user.
  // This ensures decrement works even if the row's date is stale
  // (e.g., after a day-boundary race).
  await prisma.dailyAiQuota.updateMany({
    where: {
      userId,
      [countKey]: { gt: 0 },
    },
    data: {
      [countKey]: { decrement: by },
      updatedAt: new Date(),
    },
  });
}

export async function incrementAiQuota(
  userId: string,
  kind: AiQuotaKind,
  by = 1,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  if (by < 1) return { allowed: true, current: 0, limit: AI_QUOTA_LIMITS[kind] };

  const today = startOfUtcDay(new Date());
  const limit = AI_QUOTA_LIMITS[kind];
  const countKey = `${kind}Count` as const;
  const otherKeys = (
    Object.keys(AI_QUOTA_LIMITS) as AiQuotaKind[]
  )
    .filter((k) => k !== kind)
    .map((k) => `${k}Count` as const);

  // Atomic upsert + increment
  const updated = await prisma.dailyAiQuota.upsert({
    where: { userId },
    create: {
      userId,
      date: today,
      questionsCount: kind === "questions" ? by : 0,
      materialsCount: kind === "materials" ? by : 0,
      chatCount: kind === "chat" ? by : 0,
      practiceGenCount: kind === "practiceGen" ? by : 0,
      topicGenCount: kind === "topicGen" ? by : 0,
    },
    update: {
      [countKey]: { increment: by },
      updatedAt: new Date(),
    },
  });

  // Day boundary: if date is stale, atomically reset counters.
  if (updated.date.getTime() !== today.getTime()) {
    const resetData: Record<string, unknown> = { date: today, updatedAt: new Date() };
    for (const key of otherKeys) resetData[key] = 0;
    resetData[countKey] = by;
    const resetResult = await prisma.dailyAiQuota.updateMany({
      where: { userId, date: { lt: today } },
      data: resetData,
    });
    if (resetResult.count > 0) {
      // We won the reset — counters are fresh
      return { allowed: by <= limit, current: by, limit };
    }
    // Another request already reset — re-read actual state
    // to avoid using stale upsert return value
    const fresh = await prisma.dailyAiQuota.findUnique({
      where: { userId },
    });
    const actualCount = fresh ? (fresh[countKey] as number) : by;
    if (actualCount > limit) {
      await prisma.dailyAiQuota.update({
        where: { userId },
        data: { [countKey]: { decrement: by }, updatedAt: new Date() },
      });
      return { allowed: false, current: actualCount - by, limit };
    }
    return { allowed: true, current: actualCount, limit };
  }

  // Normal path: check limit — if over, roll back the increment
  const newCount = updated[countKey] as number;
  if (newCount > limit) {
    await prisma.dailyAiQuota.update({
      where: { userId },
      data: { [countKey]: { decrement: by }, updatedAt: new Date() },
    });
    return { allowed: false, current: newCount - by, limit };
  }

  return { allowed: true, current: newCount, limit };
}
