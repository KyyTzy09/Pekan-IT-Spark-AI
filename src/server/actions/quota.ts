"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AI_QUOTA_LIMITS, type AiQuotaKind } from "@/server/ai-quota";

export type QuotaStatus = {
  kind: AiQuotaKind;
  label: string;
  icon: string;
  used: number;
  limit: number;
  resetAt: string;
};

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getMyQuota(): Promise<QuotaStatus[]> {
  const session = await getSession();
  if (!session?.id) return [];

  const today = startOfUtcDay(new Date());
  const resetAt = new Date(today.getTime() + 86_400_000).toISOString();

  const quota = await prisma.dailyAiQuota.findUnique({
    where: { userId: session.id },
  });

  const isToday = quota && quota.date.getTime() === today.getTime();

  const labels: Record<AiQuotaKind, { label: string; icon: string }> = {
    questions: { label: "Soal Practice", icon: "📝" },
    materials: { label: "Materi", icon: "📚" },
    chat: { label: "Chat AI", icon: "💬" },
    practiceGen: { label: "Generate Latihan", icon: "🎯" },
    topicGen: { label: "Generate Topik", icon: "🧩" },
  };

  return (Object.keys(AI_QUOTA_LIMITS) as AiQuotaKind[]).map((kind) => ({
    kind,
    label: labels[kind].label,
    icon: labels[kind].icon,
    used: isToday ? (quota[`${kind}Count` as const] as number) : 0,
    limit: AI_QUOTA_LIMITS[kind],
    resetAt,
  }));
}
