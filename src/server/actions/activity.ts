"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const DAY_MS = 86_400_000;

export type ActivityKind =
  | "QUESTION"
  | "MATERIAL"
  | "REFLECTION"
  | "CHAT"
  | "BADGE"
  | "STREAK"
  | "CHALLENGE";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string | null;
  subjectName: string | null;
  xp: number;
  timestamp: string; // ISO
};

export type ActivityHeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style intensity
};

export type DailySeriesPoint = {
  date: string; // YYYY-MM-DD
  count: number;
  xp: number;
};

export type StudentActivity = {
  userId: string;
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  totalActivities: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  byKind: Record<ActivityKind, number>;
  heatmap: ActivityHeatmapDay[];
  recent: ActivityEntry[];
  dailySeries: DailySeriesPoint[];
};

/**
 * Build a GitHub-style intensity level (0-4) from a count.
 * 0 = none, 1 = 1, 2 = 2-3, 3 = 4-6, 4 = 7+
 * Thresholds tuned for typical student engagement.
 */
function intensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Fetch aggregated activity data for a student over a rolling window.
 *
 * Includes:
 * - Heatmap (default 365 days) for GitHub-style visualization
 * - Recent activity list (max 50 entries, most recent first)
 * - Daily series (last 30 days) for line chart
 * - Totals: total activities, active days, current/longest streak
 * - Breakdown by kind
 *
 * Authorization: student can read their own; parent can read their linked child.
 */
export async function getStudentActivity(
  userId: string,
  windowDays = 365,
): Promise<StudentActivity> {
  const session = await getSession();
  if (!session?.id) throw new Error("UNAUTHORIZED");
  if (session.role === "STUDENT" && session.id !== userId) {
    throw new Error("FORBIDDEN");
  }
  if (session.role === "PARENT") {
    const link = await prisma.parentStudentLink.findFirst({
      where: {
        parentId: session.id,
        studentId: userId,
        status: "ACCEPTED",
      },
      select: { id: true },
    });
    if (!link) throw new Error("FORBIDDEN");
  }

  const safeWindow = Math.max(1, Math.min(730, Math.floor(windowDays))); // cap 2y
  const now = new Date();
  const windowStart = startOfDay(
    new Date(now.getTime() - (safeWindow - 1) * DAY_MS),
  );
  const windowEnd = startOfDay(now);

  // ============================================================================
  // Pull all activity sources in parallel for the window
  // ============================================================================
  const [
    questionAttempts,
    materialReads,
    reflections,
    xpTransactions,
    challengeCompletions,
    streak,
  ] = await Promise.all([
    prisma.questionAttempt.findMany({
      where: { userId, createdAt: { gte: windowStart, lte: now } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        question: {
          select: {
            concept: {
              select: {
                topic: { select: { subject: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.materialRead.findMany({
      where: { userId, readAt: { gte: windowStart, lte: now } },
      orderBy: { readAt: "desc" },
      take: 200,
      include: {
        material: {
          select: { title: true, subject: { select: { name: true } } },
        },
      },
    }),
    prisma.reflection.findMany({
      where: { userId, submittedAt: { gte: windowStart, lte: now } },
      orderBy: { submittedAt: "desc" },
      take: 100,
      include: {
        challenge: {
          select: { subject: { select: { name: true } } },
        },
      },
    }),
    prisma.xpTransaction.findMany({
      where: { userId, createdAt: { gte: windowStart, lte: now } },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        source: true,
        amount: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.challengeItem.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: windowStart, lte: now },
        challenge: { userId },
      },
      orderBy: { completedAt: "desc" },
      take: 200,
      include: {
        challenge: {
          select: {
            scheduledFor: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
    prisma.streak.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  // ============================================================================
  // Build ActivityEntry list (all sources unified)
  // ============================================================================
  const entries: ActivityEntry[] = [];

  for (const a of questionAttempts) {
    const subj = a.question.concept.topic.subject.name;
    entries.push({
      id: `q-${a.id}`,
      kind: "QUESTION",
      title: a.isCorrect ? "Soal dijawab benar" : "Soal dijawab (salah)",
      description: a.isCorrect ? "Mantap!" : "Tetap semangat, coba lagi yuk.",
      subjectName: subj,
      xp: a.isCorrect ? 10 : 0,
      timestamp: a.createdAt.toISOString(),
    });
  }

  for (const m of materialReads) {
    entries.push({
      id: `m-${m.id}`,
      kind: "MATERIAL",
      title: `Materi dibaca: ${m.material.title}`,
      description: m.completed ? "Selesai dibaca" : "Sebagian dibaca",
      subjectName: m.material.subject?.name ?? null,
      xp: 5,
      timestamp: m.readAt.toISOString(),
    });
  }

  for (const r of reflections) {
    entries.push({
      id: `r-${r.id}`,
      kind: "REFLECTION",
      title: "Refleksi ditulis",
      description:
        r.response.slice(0, 120) + (r.response.length > 120 ? "…" : ""),
      subjectName: r.challenge.subject?.name ?? null,
      xp: 15,
      timestamp: r.submittedAt.toISOString(),
    });
  }

  for (const c of challengeCompletions) {
    const kindLabel =
      c.kind === "QUESTION"
        ? "Tantangan soal selesai"
        : c.kind === "MATERIAL"
          ? "Tantangan materi selesai"
          : "Tantangan refleksi selesai";
    entries.push({
      id: `c-${c.id}`,
      kind: "CHALLENGE",
      title: kindLabel,
      description: c.answer ? c.answer.slice(0, 100) : null,
      subjectName: c.challenge.subject?.name ?? null,
      xp: c.points,
      timestamp: (c.completedAt ?? c.challenge.scheduledFor).toISOString(),
    });
  }

  for (const x of xpTransactions) {
    if (x.source === "ANSWER_CORRECT" || x.source === "CONCEPT_MASTERED")
      continue; // already covered by questionAttempts
    if (x.amount <= 0) continue;
    const meta = (x.metadata ?? {}) as Record<string, string>;
    entries.push({
      id: `x-${x.id}`,
      kind:
        x.source === "BADGE_UNLOCK"
          ? "BADGE"
          : x.source === "STREAK"
            ? "STREAK"
            : "CHALLENGE",
      title:
        x.source === "BADGE_UNLOCK"
          ? `Badge terbuka: ${meta.badgeName ?? "Baru"}`
          : x.source === "STREAK"
            ? "Bonus streak harian"
            : `XP dari ${x.source.toLowerCase().replace(/_/g, " ")}`,
      description: null,
      subjectName: null,
      xp: x.amount,
      timestamp: x.createdAt.toISOString(),
    });
  }

  // Sort most recent first, take 50
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recent = entries.slice(0, 50);

  // ============================================================================
  // Heatmap (per-day bucket for the full window)
  // ============================================================================
  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < safeWindow; i++) {
    const d = new Date(windowStart.getTime() + i * DAY_MS);
    dayBuckets.set(ymd(d), 0);
  }

  // Increment from entries (one per activity)
  for (const e of entries) {
    const day = ymd(new Date(e.timestamp));
    if (dayBuckets.has(day)) {
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
    }
  }

  const heatmap: ActivityHeatmapDay[] = [];
  for (let i = 0; i < safeWindow; i++) {
    const d = new Date(windowStart.getTime() + i * DAY_MS);
    const key = ymd(d);
    const count = dayBuckets.get(key) ?? 0;
    heatmap.push({ date: key, count, level: intensityLevel(count) });
  }

  // ============================================================================
  // Daily series (last 30 days for line chart, separate from heatmap window)
  // ============================================================================
  const seriesDays = Math.min(30, safeWindow);
  const seriesStart = startOfDay(
    new Date(now.getTime() - (seriesDays - 1) * DAY_MS),
  );
  const seriesBuckets = new Map<string, { count: number; xp: number }>();
  for (let i = 0; i < seriesDays; i++) {
    const d = new Date(seriesStart.getTime() + i * DAY_MS);
    seriesBuckets.set(ymd(d), { count: 0, xp: 0 });
  }
  for (const e of entries) {
    const tsDate = new Date(e.timestamp);
    const day = ymd(tsDate);
    const b = seriesBuckets.get(day);
    if (b) {
      b.count += 1;
      b.xp += e.xp;
    }
  }
  const dailySeries: DailySeriesPoint[] = [];
  for (let i = 0; i < seriesDays; i++) {
    const d = new Date(seriesStart.getTime() + i * DAY_MS);
    const key = ymd(d);
    const b = seriesBuckets.get(key) ?? { count: 0, xp: 0 };
    dailySeries.push({ date: key, count: b.count, xp: b.xp });
  }

  // ============================================================================
  // Stats
  // ============================================================================
  const activeDays = heatmap.filter((d) => d.count > 0).length;
  const totalActivities = entries.length;

  // Compute current streak from heatmap (consecutive days with count > 0, ending today)
  let currentStreak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i]?.count && heatmap[i]!.count > 0) {
      currentStreak++;
    } else if (i === heatmap.length - 1) {
    } else {
      break;
    }
  }

  // Compute longest streak from heatmap
  let longestStreakFromHeatmap = 0;
  let runStreak = 0;
  for (const d of heatmap) {
    if (d.count > 0) {
      runStreak++;
      longestStreakFromHeatmap = Math.max(longestStreakFromHeatmap, runStreak);
    } else {
      runStreak = 0;
    }
  }

  // Use Streak table value if it's higher (it may include days outside window)
  const longestStreak = Math.max(
    streak?.longestStreak ?? 0,
    longestStreakFromHeatmap,
  );

  // By kind
  const byKind: Record<ActivityKind, number> = {
    QUESTION: 0,
    MATERIAL: 0,
    REFLECTION: 0,
    CHAT: 0,
    BADGE: 0,
    STREAK: 0,
    CHALLENGE: 0,
  };
  for (const e of entries) {
    byKind[e.kind]++;
  }

  return {
    userId,
    windowDays: safeWindow,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    totalActivities,
    activeDays,
    currentStreak,
    longestStreak,
    byKind,
    heatmap,
    recent,
    dailySeries,
  };
}
