import "server-only";

export const AI_QUOTA_LIMITS = {
  questions: 20,
  materials: 5,
} as const;

export type AiQuotaKind = keyof typeof AI_QUOTA_LIMITS;

export type AiQuotaSnapshot = {
  questionsCount: number;
  materialsCount: number;
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
  const { prisma } = await import("@/lib/prisma");
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
  const { prisma } = await import("@/lib/prisma");
  const today = startOfUtcDay(new Date());

  const existing = await prisma.dailyAiQuota.findUnique({
    where: { userId },
  });

  if (!canIncrementQuota(existing, kind, by)) {
    return {
      allowed: false,
      current: existing ? (existing[`${kind}Count` as const] as number) : 0,
      limit: AI_QUOTA_LIMITS[kind],
    };
  }

  if (existing) {
    if (existing.date.getTime() === today.getTime()) {
      const updated = await prisma.dailyAiQuota.update({
        where: { userId },
        data: {
          [`${kind}Count` as const]: { increment: by },
          updatedAt: new Date(),
        },
      });
      return {
        allowed: true,
        current: updated[`${kind}Count` as const] as number,
        limit: AI_QUOTA_LIMITS[kind],
      };
    }
    const updated = await prisma.dailyAiQuota.update({
      where: { userId },
      data: {
        date: today,
        questionsCount: kind === "questions" ? by : 0,
        materialsCount: kind === "materials" ? by : 0,
        updatedAt: new Date(),
      },
    });
    return {
      allowed: true,
      current: updated[`${kind}Count` as const] as number,
      limit: AI_QUOTA_LIMITS[kind],
    };
  }

  const created = await prisma.dailyAiQuota.create({
    data: {
      userId,
      date: today,
      questionsCount: kind === "questions" ? by : 0,
      materialsCount: kind === "materials" ? by : 0,
    },
  });
  return {
    allowed: true,
    current: created[`${kind}Count` as const] as number,
    limit: AI_QUOTA_LIMITS[kind],
  };
}
