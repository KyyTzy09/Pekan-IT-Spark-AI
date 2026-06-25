import "server-only";
import { cache } from "react";

import { levelFromXp } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import type { SubjectSlug } from "../../../generated/prisma/client";

export type DashboardLevelInfo = {
  level: number;
  name: string;
  totalXp: number;
  currentMinXp: number;
  nextMinXp: number | null;
  progress: number;
  xpToNext: number | null;
};

export type DashboardSubjectProgress = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  order: number;
  totalConcepts: number;
  masteredConcepts: number;
  learningConcepts: number;
  strugglingConcepts: number;
  notStartedConcepts: number;
  masteryPct: number;
  attemptCount: number;
};

export type DashboardRecommendation = {
  type: "continue" | "new";
  conceptId: string;
  conceptName: string;
  conceptSlug: string;
  topicId: string;
  subjectName: string;
  subjectSlug: SubjectSlug;
  subjectColor: string | null;
  subjectIcon: string | null;
  masteryScore: number;
  status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
  reason: string;
};

export type DashboardSummary = {
  student: {
    id: string;
    name: string;
    grade: number | null;
    school: string | null;
    learningStyle: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
  };
  greeting: string;
  greetingSubtitle: string;
  sparkTip: string;
  streak: {
    current: number;
    longest: number;
    freezeAvailable: number;
  };
  level: DashboardLevelInfo;
  subjects: DashboardSubjectProgress[];
  totalMastered: number;
  totalConcepts: number;
  totalAttempts: number;
  recommendation: DashboardRecommendation | null;
  recentDocuments: number;
};

function timeBasedGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  if (hour < 5) {
    return {
      greeting: "Belum tidur juga?",
      subtitle: "Istirahat dulu, yuk. Besok kita lanjut lebih semangat.",
    };
  }
  if (hour < 11) {
    return {
      greeting: "Pagi yang cerah!",
      subtitle: "Mulai hari dengan satu konsep baru. Pelan-pelan aja.",
    };
  }
  if (hour < 15) {
    return {
      greeting: "Hai, siang!",
      subtitle: "Cocok banget buat review materi tadi pagi. Gas?",
    };
  }
  if (hour < 18) {
    return {
      greeting: "Sore ini mau ngapain?",
      subtitle: "Coba selesaikan satu misi harian. Nggak lama, kok.",
    };
  }
  if (hour < 22) {
    return {
      greeting: "Halo, malam!",
      subtitle: "Waktu yang pas buat latihan soal. Aku temenin.",
    };
  }
  return {
    greeting: "Udah malem, nih.",
    subtitle: "Kalo mau belajar, pelan-pelan. Kalo mau tidur, juga bagus.",
  };
}

const SPARK_TIPS = [
  "Coba jelasin konsep hari ini pakai bahasamu sendiri — bagus buat ngecek pemahaman.",
  "Salah itu biasa. Yang penting ngerti kenapa salah, biar nggak keulang.",
  "Belajar 15 menit tanpa jeda lebih efektif daripada 1 jam sambil scrolling.",
  "Kalau stuck, coba ganti gaya: visual, contoh, atau tanya balik. Kamu yang pilih.",
  "Jangan buru-buru mastering. Paham dulu, hafal belakangan.",
];

function pickSparkTip(): string {
  const idx = new Date().getDate() % SPARK_TIPS.length;
  return SPARK_TIPS[idx] ?? SPARK_TIPS[0] ?? "";
}

export const getDashboardSummary = cache(
  async (userId: string): Promise<DashboardSummary> => {
    const [profile, user] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          grade: true,
          school: true,
          learningStyle: true,
          focusedSubjects: true,
          totalXp: true,
          level: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      }),
    ]);
    const focusedIds = profile?.focusedSubjects ?? [];

    const [streak, levels, allSubjects, knowledgeProfiles, attempts, docs] =
      await Promise.all([
        prisma.streak.findUnique({
          where: { userId },
          select: {
            currentStreak: true,
            longestStreak: true,
            freezeAvailable: true,
          },
        }),
        prisma.level.findMany({
          orderBy: { level: "asc" },
          select: { level: true, name: true, minXp: true, maxXp: true },
        }),
        prisma.subject.findMany({
          where: focusedIds.length > 0 ? { id: { in: focusedIds } } : undefined,
          orderBy: { order: "asc" },
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
            color: true,
            order: true,
          },
        }),
        prisma.studentKnowledgeProfile.findMany({
          where: { userId },
          select: {
            conceptId: true,
            masteryScore: true,
            status: true,
            lastAttemptAt: true,
            attemptCount: true,
          },
        }),
        prisma.questionAttempt.count({ where: { userId } }),
        prisma.document.count({ where: { userId } }),
      ]);

    const totalXp = profile?.totalXp ?? 0;
    const computed = levelFromXp(totalXp, levels);
    const levelInfo: DashboardLevelInfo = {
      ...computed,
      totalXp,
    };

    const allConcepts = await prisma.concept.findMany({
      where:
        focusedIds.length > 0
          ? { topic: { subjectId: { in: focusedIds } } }
          : undefined,
      select: { id: true, topic: { select: { subjectId: true } } },
    });
    const conceptsBySubject = new Map<string, number>();
    for (const c of allConcepts) {
      conceptsBySubject.set(
        c.topic.subjectId,
        (conceptsBySubject.get(c.topic.subjectId) ?? 0) + 1,
      );
    }

    const profilesByConcept = new Map(
      knowledgeProfiles.map((p) => [p.conceptId, p]),
    );

    const subjects: DashboardSubjectProgress[] = allSubjects.map((s) => {
      const totalConcepts = conceptsBySubject.get(s.id) ?? 0;
      const subjectConcepts = allConcepts
        .filter((c) => c.topic.subjectId === s.id)
        .map((c) => c.id);
      const profiles = subjectConcepts
        .map((id) => profilesByConcept.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      const mastered = profiles.filter((p) => p.status === "MASTERED").length;
      const learning = profiles.filter((p) => p.status === "LEARNING").length;
      const struggling = profiles.filter(
        (p) => p.status === "STRUGGLING",
      ).length;
      const notStarted = Math.max(0, totalConcepts - profiles.length);
      const totalScore = profiles.reduce((acc, p) => acc + p.masteryScore, 0);
      const masteryPct =
        profiles.length > 0
          ? Math.round((totalScore / profiles.length) * 100)
          : 0;
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        icon: s.icon,
        color: s.color,
        order: s.order,
        totalConcepts,
        masteredConcepts: mastered,
        learningConcepts: learning,
        strugglingConcepts: struggling,
        notStartedConcepts: notStarted,
        masteryPct,
        attemptCount: profiles.reduce((acc, p) => acc + p.attemptCount, 0),
      };
    });

    let recommendation: DashboardRecommendation | null = null;
    const lastProfile = knowledgeProfiles
      .filter((p) => p.lastAttemptAt)
      .sort(
        (a, b) =>
          (b.lastAttemptAt?.getTime() ?? 0) - (a.lastAttemptAt?.getTime() ?? 0),
      )[0];
    const focusConceptId = lastProfile?.conceptId ?? null;

    if (focusConceptId) {
      const concept = await prisma.concept.findUnique({
        where: { id: focusConceptId },
        include: { topic: { include: { subject: true } } },
      });
      const profile = profilesByConcept.get(focusConceptId);
      if (concept && profile) {
        const status = profile.status as
          | "NOT_STARTED"
          | "LEARNING"
          | "MASTERED"
          | "STRUGGLING";
        const reason =
          status === "STRUGGLING"
            ? "Kamu sempat struggle di sini — yuk ulang biar makin nempel."
            : status === "LEARNING"
              ? "Lanjut konsep ini biar kelar. Kamu udah setengah jalan!"
              : "Konsep terakhir kamu. Biar makin nempel, coba 5 soal lagi.";
        recommendation = {
          type: "continue",
          conceptId: concept.id,
          conceptName: concept.name,
          conceptSlug: concept.slug,
          topicId: concept.topic.id,
          subjectName: concept.topic.subject.name,
          subjectSlug: concept.topic.subject.slug as SubjectSlug,
          subjectColor: concept.topic.subject.color,
          subjectIcon: concept.topic.subject.icon,
          masteryScore: profile.masteryScore,
          status,
          reason,
        };
      }
    } else if (focusedIds.length > 0) {
      const firstSubject = await prisma.subject.findFirst({
        where: { id: { in: focusedIds } },
        include: {
          topics: {
            orderBy: { order: "asc" },
            take: 1,
            include: {
              concepts: { orderBy: { order: "asc" }, take: 1 },
            },
          },
        },
        orderBy: { order: "asc" },
      });
      const concept = firstSubject?.topics[0]?.concepts[0];
      if (concept && firstSubject) {
        recommendation = {
          type: "new",
          conceptId: concept.id,
          conceptName: concept.name,
          conceptSlug: concept.slug,
          topicId: concept.topicId,
          subjectName: firstSubject.name,
          subjectSlug: firstSubject.slug as SubjectSlug,
          subjectColor: firstSubject.color,
          subjectIcon: firstSubject.icon,
          masteryScore: 0,
          status: "NOT_STARTED",
          reason: "Mulai dari konsep pertama di mata pelajaran fokus kamu.",
        };
      }
    }

    const totalMastered = knowledgeProfiles.filter(
      (p) => p.status === "MASTERED",
    ).length;
    const totalConceptsAll = allConcepts.length;
    const greeting = timeBasedGreeting();
    const sparkTip = pickSparkTip();

    return {
      student: {
        id: userId,
        name: user?.name ?? "Teman",
        grade: profile?.grade ?? null,
        school: profile?.school ?? null,
        learningStyle: profile?.learningStyle ?? null,
      },
      greeting: greeting.greeting,
      greetingSubtitle: greeting.subtitle,
      sparkTip,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
        freezeAvailable: streak?.freezeAvailable ?? 1,
      },
      level: levelInfo,
      subjects,
      totalMastered,
      totalConcepts: totalConceptsAll,
      totalAttempts: attempts,
      recommendation,
      recentDocuments: docs,
    };
  },
);
export type SubjectExplorerSummary = {
  subject: {
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    isCustom: boolean;
    source: "OFFICIAL" | "AI_GENERATED" | "USER_CREATED";
  };
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    order: number;
    totalConcepts: number;
    masteredConcepts: number;
    averageMastery: number;
  }>;
  totalConcepts: number;
  masteredConcepts: number;
  pretestCompleted: boolean;
};

export async function getSubjectDetail(
  subjectSlug: string,
  userId: string,
): Promise<SubjectExplorerSummary | null> {
  // First try to find by slug (exact match for official, or custom slug)
  let subject = await prisma.subject.findFirst({
    where: { slug: { equals: subjectSlug, mode: "insensitive" } },
    include: {
      topics: {
        orderBy: { order: "asc" },
        include: {
          concepts: { select: { id: true } },
        },
      },
    },
  });

  // If not found by slug, try to find by name (for custom subjects)
  if (!subject) {
    subject = await prisma.subject.findFirst({
      where: {
        name: { equals: subjectSlug.replace(/-/g, " "), mode: "insensitive" },
        OR: [{ createdById: null }, { createdById: userId }],
      },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: {
            concepts: { select: { id: true } },
          },
        },
      },
    });
  }

  if (!subject) return null;

  const [profiles, pretestQuestionCount] = await Promise.all([
    prisma.studentKnowledgeProfile.findMany({
      where: {
        userId,
        concept: { topic: { subjectId: subject.id } },
      },
      select: {
        conceptId: true,
        status: true,
        masteryScore: true,
      },
    }),
    prisma.question.count({
      where: {
        isActive: true,
        tags: { has: "pretest" },
        concept: { topic: { subjectId: subject.id } },
      },
    }),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.conceptId, p]));

  let pretestCompleted = true;
  if (pretestQuestionCount > 0) {
    const attemptsCount = await prisma.questionAttempt.count({
      where: {
        userId,
        question: {
          tags: { has: "pretest" },
          concept: { topic: { subjectId: subject.id } },
        },
      },
    });
    pretestCompleted = attemptsCount >= pretestQuestionCount;
  }

  const topics = subject.topics.map((t) => {
    const conceptIds = t.concepts.map((c) => c.id);
    const tProfiles = conceptIds
      .map((id) => profileMap.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const totalScore = tProfiles.reduce((acc, p) => acc + p.masteryScore, 0);
    const mastered = tProfiles.filter((p) => p.status === "MASTERED").length;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      order: t.order,
      totalConcepts: t.concepts.length,
      masteredConcepts: mastered,
      averageMastery:
        tProfiles.length > 0
          ? Math.round((totalScore / tProfiles.length) * 100)
          : 0,
    };
  });

  const allProfiles = profiles;
  return {
    subject: {
      id: subject.id,
      slug: subject.slug,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      description: subject.description,
      isCustom: subject.isCustom,
      source: subject.source,
    },
    topics,
    totalConcepts: subject.topics.reduce(
      (acc, t) => acc + t.concepts.length,
      0,
    ),
    masteredConcepts: allProfiles.filter((p) => p.status === "MASTERED").length,
    pretestCompleted,
  };
}

export type TopicDetailSummary = {
  topic: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    subjectName: string;
    subjectSlug: SubjectSlug;
    subjectColor: string | null;
    subjectIcon: string | null;
  };
  concepts: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
    masteryScore: number;
    isLocked: boolean;
    unmetPrerequisites: Array<{ id: string; name: string }>;
    materials: Array<{ id: string; difficulty: string }>;
  }>;
  totalConcepts: number;
  masteredConcepts: number;
  averageMastery: number;
};

export async function getTopicDetail(
  topicId: string,
  userId: string,
): Promise<TopicDetailSummary | null> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: true,
      concepts: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          prerequisites: {
            select: {
              prerequisiteId: true,
              prerequisite: {
                select: {
                  name: true,
                },
              },
            },
          },
          materials: {
            select: {
              id: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });
  if (!topic) return null;

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId, concept: { topicId } },
    select: { conceptId: true, status: true, masteryScore: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.conceptId, p]));

  // Fetch all prerequisite profiles in one query to handle cross-topic dependencies
  const allPrereqIds = topic.concepts.flatMap((c) =>
    c.prerequisites.map((p) => p.prerequisiteId),
  );
  const prereqProfiles =
    allPrereqIds.length > 0
      ? await prisma.studentKnowledgeProfile.findMany({
          where: { userId, conceptId: { in: allPrereqIds } },
          select: { conceptId: true, masteryScore: true },
        })
      : [];
  const prereqMasteryMap = new Map(
    prereqProfiles.map((p) => [p.conceptId, p.masteryScore]),
  );

  const concepts = topic.concepts.map((c) => {
    const p = profileMap.get(c.id);

    const unmetPrerequisites = c.prerequisites
      .filter((prereq) => {
        const sameTopicProfile = profileMap.get(prereq.prerequisiteId);
        const score = sameTopicProfile
          ? sameTopicProfile.masteryScore
          : (prereqMasteryMap.get(prereq.prerequisiteId) ?? 0);
        return score < 0.7;
      })
      .map((prereq) => ({
        id: prereq.prerequisiteId,
        name: prereq.prerequisite.name,
      }));

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      status: (p?.status ?? "NOT_STARTED") as
        | "NOT_STARTED"
        | "LEARNING"
        | "MASTERED"
        | "STRUGGLING",
      masteryScore: p?.masteryScore ?? 0,
      isLocked: unmetPrerequisites.length > 0,
      unmetPrerequisites,
      materials: c.materials.map((m) => ({
        id: m.id,
        difficulty: m.difficulty,
      })),
    };
  });

  const totalScore = concepts.reduce((acc, c) => acc + c.masteryScore, 0);
  const mastered = concepts.filter((c) => c.status === "MASTERED").length;
  return {
    topic: {
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      subjectName: topic.subject.name,
      subjectSlug: topic.subject.slug as SubjectSlug,
      subjectColor: topic.subject.color,
      subjectIcon: topic.subject.icon,
    },
    concepts,
    totalConcepts: concepts.length,
    masteredConcepts: mastered,
    averageMastery:
      concepts.length > 0
        ? Math.round((totalScore / concepts.length) * 100)
        : 0,
  };
}
