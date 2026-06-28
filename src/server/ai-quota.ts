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
  const today = startOfUtcDay(new Date());

  const existing = await prisma.dailyAiQuota.findUnique({
    where: { userId },
  });

  if (!existing || existing.date.getTime() !== today.getTime()) return;

  const current = existing[`${kind}Count` as const] as number;
  if (current <= 0) return;

  await prisma.dailyAiQuota.update({
    where: { userId },
    data: {
      [`${kind}Count` as const]: Math.max(0, current - by),
      updatedAt: new Date(),
    },
  });
}

export async function incrementAiQuota(
  userId: string,
  kind: AiQuotaKind,
  by = 1,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const today = startOfUtcDay(new Date());
  const limit = AI_QUOTA_LIMITS[kind];
  const countKey = `${kind}Count` as const;
  const otherKeys = (
    Object.keys(AI_QUOTA_LIMITS) as AiQuotaKind[]
  )
    .filter((k) => k !== kind)
    .map((k) => `${k}Count` as const);

  // Atomic upsert + increment — no Serializable isolation, no P2034, no retry loop
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

  const newCount = updated[countKey] as number;

  // Day boundary: if date is stale, reset all counters then re-increment
  if (updated.date.getTime() !== today.getTime()) {
    const resetData: Record<string, unknown> = { date: today, updatedAt: new Date() };
    for (const key of otherKeys) resetData[key] = 0;
    resetData[countKey] = by;
    await prisma.dailyAiQuota.update({
      where: { userId },
      data: resetData,
    });
    return { allowed: by <= limit, current: by, limit };
  }

  // Check limit — if over, roll back the increment
  if (newCount > limit) {
    await prisma.dailyAiQuota.update({
      where: { userId },
      data: { [countKey]: { decrement: by }, updatedAt: new Date() },
    });
    return { allowed: false, current: newCount - by, limit };
  }

  return { allowed: true, current: newCount, limit };
}
