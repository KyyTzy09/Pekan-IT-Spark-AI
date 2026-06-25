import "server-only";

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
  const limit = AI_QUOTA_LIMITS[kind];
  const countKey = `${kind}Count` as const;

  // Use serializable transaction to prevent race conditions.
  // Two concurrent requests will serialize — one wins, one retries.
  return await prisma.$transaction(async (tx) => {
    // Upsert: ensure row exists for today
    const existing = await tx.dailyAiQuota.findUnique({ where: { userId } });

    if (!existing || existing.date.getTime() !== today.getTime()) {
      // New day or new user — create/reset
      const created = await tx.dailyAiQuota.upsert({
        where: { userId },
        create: {
          userId,
          date: today,
          questionsCount: kind === "questions" ? by : 0,
          materialsCount: kind === "materials" ? by : 0,
          chatCount: kind === "chat" ? by : 0,
        },
        update: {
          date: today,
          questionsCount: kind === "questions" ? by : 0,
          materialsCount: kind === "materials" ? by : 0,
          chatCount: kind === "chat" ? by : 0,
          updatedAt: new Date(),
        },
      });
      const current = created[countKey] as number;
      if (current > limit) {
        return { allowed: false, current, limit };
      }
      return { allowed: true, current, limit };
    }

    // Same day — check then increment atomically within transaction
    const current = existing[countKey] as number;
    if (current + by > limit) {
      return { allowed: false, current, limit };
    }

    const updated = await tx.dailyAiQuota.update({
      where: { userId },
      data: {
        [countKey]: { increment: by },
        updatedAt: new Date(),
      },
    });

    return {
      allowed: true,
      current: updated[countKey] as number,
      limit,
    };
  }, {
    // Use serializable isolation to prevent concurrent over-increment
    isolationLevel: "Serializable",
  });
}
