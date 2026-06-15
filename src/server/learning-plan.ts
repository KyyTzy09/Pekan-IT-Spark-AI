import "server-only";

import { prisma } from "@/lib/prisma";
import type { ConceptStatus } from "../../generated/prisma/client";

export type PlanActivityType =
  | "review"
  | "practice"
  | "explore"
  | "quiz"
  | "chat"
  | "rest";

export type PlanActivity = {
  id: string;
  type: PlanActivityType;
  subjectSlug: string;
  subjectName: string;
  subjectIcon: string | null;
  subjectColor: string | null;
  topicId?: string;
  topicName?: string;
  conceptId?: string;
  conceptName?: string;
  conceptStatus?: ConceptStatus;
  title: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
};

export type PlanDay = {
  date: string;
  dayName: string;
  shortDayName: string;
  activities: PlanActivity[];
};

export type PlanSummary = {
  totalActivities: number;
  completedActivities: number;
  estimatedMinutes: number;
  focusAreas: string[];
  totalXp: number;
  earnedXp: number;
};

export type WeeklyPlan = {
  weekStart: string;
  weekEnd: string;
  days: PlanDay[];
  summary: PlanSummary;
};

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const SHORT_DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const ACTIVITY_TEMPLATES: Record<
  PlanActivityType,
  { baseTitle: string; baseDescription: string; minutes: number; xp: number }
> = {
  review: {
    baseTitle: "Ulangi konsep",
    baseDescription: "Review konsep yang masih struggle biar makin nempel",
    minutes: 10,
    xp: 15,
  },
  practice: {
    baseTitle: "Latihan soal",
    baseDescription: "Latihan soal adaptif sesuai level kamu",
    minutes: 15,
    xp: 20,
  },
  explore: {
    baseTitle: "Pelajari konsep baru",
    baseDescription: "Kenalan sama konsep baru di topik yang kamu pilih",
    minutes: 20,
    xp: 30,
  },
  quiz: {
    baseTitle: "Mini quiz",
    baseDescription: "Uji pemahaman kamu di topik ini",
    minutes: 15,
    xp: 25,
  },
  chat: {
    baseTitle: "Ngobrol dengan Spark",
    baseDescription: "Diskusi Socratic sama Spark",
    minutes: 10,
    xp: 15,
  },
  rest: {
    baseTitle: "Hari libur",
    description: "Istirahat dulu. Besok lanjut lagi!",
    baseTitle_used: "",
    baseDescription: "Istirahat dulu. Besok lanjut lagi!",
    minutes: 0,
    xp: 0,
  } as {
    baseTitle: string;
    baseDescription: string;
    minutes: number;
    xp: number;
  },
};

void ACTIVITY_TEMPLATES;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function pickActivitiesForDay(
  _date: Date,
  focusSubjects: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>,
  conceptBank: Map<
    string,
    Array<{
      id: string;
      topicId: string;
      topicName: string;
      name: string;
      status: ConceptStatus;
    }>
  >,
  dayIndex: number,
): PlanActivity[] {
  const activities: PlanActivity[] = [];
  const isRest = dayIndex === 6; // Sunday = rest day

  if (isRest) {
    activities.push({
      id: randomId(),
      type: "rest",
      subjectSlug: "",
      subjectName: "",
      subjectIcon: null,
      subjectColor: null,
      title: "Hari libur ✨",
      description:
        "Istirahat dulu. Streak aman kalo kemarin udah pernah aktivitas.",
      estimatedMinutes: 0,
      xpReward: 0,
      completed: false,
    });
    return activities;
  }

  const today = focusSubjects[dayIndex % Math.max(focusSubjects.length, 1)];
  const allSubjects = focusSubjects;

  if (!today) {
    activities.push({
      id: randomId(),
      type: "chat",
      subjectSlug: "",
      subjectName: "Spark",
      subjectIcon: null,
      subjectColor: null,
      title: "Ngobrol bebas sama Spark",
      description: "Bahas apa aja yang lagi bikin penasaran",
      estimatedMinutes: 10,
      xpReward: 15,
      completed: false,
    });
    return activities;
  }

  const concepts = conceptBank.get(today.id) ?? [];

  // Prioritize struggling → learning → not started
  const struggling = concepts.filter((c) => c.status === "STRUGGLING");
  const learning = concepts.filter((c) => c.status === "LEARNING");
  const notStarted = concepts.filter((c) => c.status === "NOT_STARTED");

  if (struggling.length > 0) {
    const c = struggling[dayIndex % struggling.length];
    if (c) {
      activities.push({
        id: randomId(),
        type: "review",
        subjectSlug: today.slug,
        subjectName: today.name,
        subjectIcon: today.icon,
        subjectColor: today.color,
        topicId: c.topicId,
        topicName: c.topicName,
        conceptId: c.id,
        conceptName: c.name,
        conceptStatus: c.status,
        title: `Review: ${c.name}`,
        description: `Konsep ini masih struggle (${c.name}). Ulangi pelan-pelan.`,
        estimatedMinutes: 10,
        xpReward: 15,
        completed: false,
      });
    }
  }

  if (learning.length > 0) {
    const c = learning[(dayIndex + 1) % learning.length];
    if (c) {
      activities.push({
        id: randomId(),
        type: "practice",
        subjectSlug: today.slug,
        subjectName: today.name,
        subjectIcon: today.icon,
        subjectColor: today.color,
        topicId: c.topicId,
        topicName: c.topicName,
        conceptId: c.id,
        conceptName: c.name,
        conceptStatus: c.status,
        title: `Latihan: ${c.name}`,
        description: `Latihan 5 soal untuk menguji pemahaman ${c.name}.`,
        estimatedMinutes: 15,
        xpReward: 20,
        completed: false,
      });
    }
  }

  if (notStarted.length > 0 && dayIndex < 5) {
    const c = notStarted[dayIndex % notStarted.length];
    if (c) {
      activities.push({
        id: randomId(),
        type: "explore",
        subjectSlug: today.slug,
        subjectName: today.name,
        subjectIcon: today.icon,
        subjectColor: today.color,
        topicId: c.topicId,
        topicName: c.topicName,
        conceptId: c.id,
        conceptName: c.name,
        conceptStatus: c.status,
        title: `Pelajari: ${c.name}`,
        description: `Kenalan sama konsep baru: ${c.name}. Pelan-pelan aja.`,
        estimatedMinutes: 20,
        xpReward: 30,
        completed: false,
      });
    }
  }

  // Add a quiz for every other day
  if (dayIndex % 2 === 1 && concepts.length > 0) {
    const c = learning[0] ?? struggling[0] ?? notStarted[0];
    if (c) {
      activities.push({
        id: randomId(),
        type: "quiz",
        subjectSlug: today.slug,
        subjectName: today.name,
        subjectIcon: today.icon,
        subjectColor: today.color,
        topicId: c.topicId,
        topicName: c.topicName,
        conceptId: c.id,
        conceptName: c.name,
        conceptStatus: c.status,
        title: `Mini quiz: ${c.topicName}`,
        description: "Uji pemahaman kamu dengan 5 soal mini quiz.",
        estimatedMinutes: 12,
        xpReward: 25,
        completed: false,
      });
    }
  }

  // Chat with Spark on lighter days
  if (activities.length < 2 && allSubjects.length > 0) {
    activities.push({
      id: randomId(),
      type: "chat",
      subjectSlug: today.slug,
      subjectName: today.name,
      subjectIcon: today.icon,
      subjectColor: today.color,
      title: "Diskusi sama Spark",
      description:
        "Ngobrol Socratic sama Spark tentang yang lagi kamu pelajari.",
      estimatedMinutes: 10,
      xpReward: 15,
      completed: false,
    });
  }

  // If absolutely nothing to do, add a small practice
  if (activities.length === 0) {
    activities.push({
      id: randomId(),
      type: "practice",
      subjectSlug: today.slug,
      subjectName: today.name,
      subjectIcon: today.icon,
      subjectColor: today.color,
      title: `Latihan bebas: ${today.name}`,
      description: "Latihan soal random dari bank soal.",
      estimatedMinutes: 15,
      xpReward: 20,
      completed: false,
    });
  }

  return activities;
}

function buildSummary(plan: { days: PlanDay[] }): PlanSummary {
  let totalActivities = 0;
  let completedActivities = 0;
  let estimatedMinutes = 0;
  let totalXp = 0;
  let earnedXp = 0;
  const subjectCount = new Map<string, number>();

  for (const day of plan.days) {
    for (const a of day.activities) {
      totalActivities += 1;
      estimatedMinutes += a.estimatedMinutes;
      totalXp += a.xpReward;
      if (a.completed) {
        completedActivities += 1;
        earnedXp += a.xpReward;
      }
      if (a.subjectName && a.type !== "rest") {
        subjectCount.set(
          a.subjectName,
          (subjectCount.get(a.subjectName) ?? 0) + 1,
        );
      }
    }
  }

  const focusAreas = Array.from(subjectCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  return {
    totalActivities,
    completedActivities,
    estimatedMinutes,
    focusAreas,
    totalXp,
    earnedXp,
  };
}

function buildPlan(
  weekStartDate: Date,
  focusSubjects: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>,
  conceptBank: Map<
    string,
    Array<{
      id: string;
      topicId: string;
      topicName: string;
      name: string;
      status: ConceptStatus;
    }>
  >,
): WeeklyPlan {
  const days: PlanDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStartDate, i);
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek] ?? "Hari";
    const shortDayName = SHORT_DAY_NAMES[dayOfWeek] ?? "?";
    const activities = pickActivitiesForDay(
      date,
      focusSubjects,
      conceptBank,
      i,
    );
    days.push({
      date: isoDate(date),
      dayName,
      shortDayName,
      activities,
    });
  }
  return {
    weekStart: isoDate(weekStartDate),
    weekEnd: isoDate(addDays(weekStartDate, 6)),
    days,
    summary: buildSummary({ days }),
  };
}

export async function getOrGenerateWeeklyPlan(
  userId: string,
): Promise<WeeklyPlan> {
  const now = new Date();
  const weekStartDate = startOfWeek(now);
  const weekStartDateTime = new Date(weekStartDate);
  weekStartDateTime.setHours(0, 0, 0, 0);

  const existing = await prisma.learningPlan.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart: weekStartDateTime,
      },
    },
  });

  if (existing) {
    return existing.plan as unknown as WeeklyPlan;
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { focusedSubjects: true },
  });
  const focusedIds = profile?.focusedSubjects ?? [];

  const [focusSubjectsRaw, allConcepts] = await Promise.all([
    prisma.subject.findMany({
      where: focusedIds.length > 0 ? { id: { in: focusedIds } } : undefined,
      orderBy: { order: "asc" },
    }),
    prisma.concept.findMany({
      where:
        focusedIds.length > 0
          ? { topic: { subjectId: { in: focusedIds } } }
          : undefined,
      include: { topic: { select: { id: true, name: true, subjectId: true } } },
      orderBy: [{ topic: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  const focusSubjects = focusSubjectsRaw.map((s) => ({
    id: s.id,
    slug: s.slug.toLowerCase(),
    name: s.name,
    icon: s.icon,
    color: s.color,
  }));

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: {
      userId,
      conceptId: { in: allConcepts.map((c) => c.id) },
    },
    select: { conceptId: true, status: true },
  });
  const statusByConcept = new Map(profiles.map((p) => [p.conceptId, p.status]));

  const conceptBank = new Map<
    string,
    Array<{
      id: string;
      topicId: string;
      topicName: string;
      name: string;
      status: ConceptStatus;
    }>
  >();
  for (const c of allConcepts) {
    const arr = conceptBank.get(c.topic.subjectId) ?? [];
    arr.push({
      id: c.id,
      topicId: c.topic.id,
      topicName: c.topic.name,
      name: c.name,
      status: statusByConcept.get(c.id) ?? "NOT_STARTED",
    });
    conceptBank.set(c.topic.subjectId, arr);
  }

  const plan = buildPlan(weekStartDate, focusSubjects, conceptBank);

  await prisma.learningPlan.create({
    data: {
      userId,
      weekStart: weekStartDateTime,
      plan: plan as unknown as object,
    },
  });

  return plan;
}

export async function regenerateWeeklyPlan(
  userId: string,
): Promise<WeeklyPlan> {
  const now = new Date();
  const weekStartDate = startOfWeek(now);
  const weekStartDateTime = new Date(weekStartDate);
  weekStartDateTime.setHours(0, 0, 0, 0);

  await prisma.learningPlan.deleteMany({
    where: {
      userId,
      weekStart: weekStartDateTime,
    },
  });

  return getOrGenerateWeeklyPlan(userId);
}

export async function completeActivity(
  userId: string,
  activityId: string,
): Promise<WeeklyPlan | null> {
  const now = new Date();
  const weekStartDateTime = startOfWeek(now);
  weekStartDateTime.setHours(0, 0, 0, 0);

  const planRow = await prisma.learningPlan.findUnique({
    where: {
      userId_weekStart: { userId, weekStart: weekStartDateTime },
    },
  });
  if (!planRow) return null;

  const plan = planRow.plan as unknown as WeeklyPlan;
  let targetActivity: PlanActivity | null = null;
  let targetDay: string | null = null;

  for (const day of plan.days) {
    for (const a of day.activities) {
      if (a.id === activityId && !a.completed) {
        a.completed = true;
        a.completedAt = new Date().toISOString();
        targetActivity = a;
        targetDay = day.date;
        break;
      }
    }
    if (targetActivity) break;
  }

  if (!targetActivity) return plan;

  plan.summary = buildSummary({ days: plan.days });

  await prisma.$transaction([
    prisma.learningPlan.update({
      where: { id: planRow.id },
      data: { plan: plan as unknown as object },
    }),
    prisma.learningActivity.create({
      data: {
        userId,
        type: "plan_activity",
        metadata: {
          activityId: targetActivity.id,
          activityType: targetActivity.type,
          subjectSlug: targetActivity.subjectSlug,
          conceptId: targetActivity.conceptId ?? null,
          date: targetDay,
        },
        xpEarned: targetActivity.xpReward,
      },
    }),
  ]);

  return plan;
}

export async function uncompleteActivity(
  userId: string,
  activityId: string,
): Promise<WeeklyPlan | null> {
  const now = new Date();
  const weekStartDateTime = startOfWeek(now);
  weekStartDateTime.setHours(0, 0, 0, 0);

  const planRow = await prisma.learningPlan.findUnique({
    where: {
      userId_weekStart: { userId, weekStart: weekStartDateTime },
    },
  });
  if (!planRow) return null;

  const plan = planRow.plan as unknown as WeeklyPlan;
  let found = false;
  for (const day of plan.days) {
    for (const a of day.activities) {
      if (a.id === activityId && a.completed) {
        a.completed = false;
        a.completedAt = undefined;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) return plan;

  plan.summary = buildSummary({ days: plan.days });

  await prisma.$transaction([
    prisma.learningPlan.update({
      where: { id: planRow.id },
      data: { plan: plan as unknown as object },
    }),
    prisma.learningActivity.deleteMany({
      where: {
        userId,
        type: "plan_activity",
      },
    }),
  ]);

  // Best effort: delete the most recent matching activity
  return plan;
}
