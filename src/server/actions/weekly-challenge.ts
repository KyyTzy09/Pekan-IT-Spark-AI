"use server";

import { revalidatePath } from "next/cache";
import { acquireDbLock, releaseDbLock } from "@/lib/db-lock";
import { prisma } from "@/lib/prisma";
import {
  generateWeeklyDeepMaterial,
  generateWeeklyPerSubjectAI,
  generateWeeklyTitleAI,
} from "@/server/ai/challenge";
import { decrementAiQuota, incrementAiQuota } from "@/server/ai-quota";

const MAX_RETRIES = 3;

import {
  computeGrowthTrend,
  computeMasteryAverage,
  distributeChallengeSubjects,
  MAX_CHALLENGE_SUBJECTS,
  pickChallengeSubjectIds,
} from "@/server/learning/strength";
import {
  computeWeeklyItemCounts,
  type WeeklyItemCounts,
} from "@/server/learning/weekly";
import type { SubjectSlug } from "../../../generated/prisma/client";

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export type WeeklySubjectInput = {
  subjectId: string;
  subjectName: string;
  subjectSlug: SubjectSlug;
  avgMastery: number;
  growthTrend: number;
  hasAttempts: boolean;
};

function classifyStrength(avgMastery: number): "weak" | "balanced" | "strong" {
  if (avgMastery < 0.4) return "weak";
  if (avgMastery <= 0.7) return "balanced";
  return "strong";
}

async function buildWeeklySubjectInput(
  userId: string,
  subjectId: string,
  now: Date,
): Promise<WeeklySubjectInput | null> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!subject || !subject.isActive) return null;

  const [recentProfiles, prevProfiles] = await Promise.all([
    prisma.studentKnowledgeProfile.findMany({
      where: {
        userId,
        updatedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) },
        concept: { topic: { subjectId } },
      },
      select: { masteryScore: true },
    }),
    prisma.studentKnowledgeProfile.findMany({
      where: {
        userId,
        updatedAt: {
          gte: new Date(now.getTime() - 14 * 86_400_000),
          lt: new Date(now.getTime() - 7 * 86_400_000),
        },
        concept: { topic: { subjectId } },
      },
      select: { masteryScore: true },
    }),
  ]);

  const recent = recentProfiles.map((p) => p.masteryScore);
  const prev = prevProfiles.map((p) => p.masteryScore);
  const all = [...recent, ...prev];

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectSlug: subject.slug as SubjectSlug,
    avgMastery: computeMasteryAverage(all),
    growthTrend: computeGrowthTrend(recent, prev),
    hasAttempts: all.length > 0,
  };
}

const BLOOMS = ["ANALYZE", "EVALUATE", "CREATE"] as const;

export async function regenerateWeeklyChallenge(userId: string): Promise<{
  ok: boolean;
  weeklyChallengeId?: string;
  error?: string;
}> {
  console.log("[WEEKLY_CHALLENGE] Starting regeneration", { userId });

  const monday = startOfWeek(new Date());
  console.log("[WEEKLY_CHALLENGE] Week start", {
    monday: monday.toISOString(),
  });

  // 🔴 Cek apakah udah ada weekly challenge buat minggu ini
  const existingWeekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });
  if (existingWeekly) {
    console.log(
      "[WEEKLY_CHALLENGE] Skip — udah ada weekly challenge minggu ini",
      { userId, weekStart: monday.toISOString() },
    );
    return { ok: true, weeklyChallengeId: existingWeekly.id };
  }

  // 🔴 Lock: cegah regenerasi dobel (DB-backed for Vercel)
  if (!(await acquireDbLock(userId, "WEEKLY"))) {
    console.log(
      "[WEEKLY_CHALLENGE] Skip — regenerasi udah berjalan, tunggu selesai",
      { userId },
    );
    return { ok: false, error: "Regenerasi sedang berjalan" };
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      grade: true,
      learningStyle: true,
      weeklyChallengeSubjectIds: true,
      focusedSubjects: true,
      user: { select: { name: true } },
    },
  });

  if (!profile) {
    console.log("[WEEKLY_CHALLENGE] No profile found", { userId });
    return { ok: false, error: "Profil tidak ditemukan" };
  }

  console.log("[WEEKLY_CHALLENGE] Profile loaded", {
    grade: profile.grade,
    learningStyle: profile.learningStyle,
    weeklyChallengeSubjectIds: profile.weeklyChallengeSubjectIds.length,
    focusedSubjects: profile.focusedSubjects.length,
  });

  const subjectIds = pickChallengeSubjectIds(
    {
      challengeSubjectIds: profile.weeklyChallengeSubjectIds,
      focusedSubjects: profile.focusedSubjects,
    },
    [], // BUG-FIX: No fallback — empty array if no subjects selected
  );

  console.log("[WEEKLY_CHALLENGE] Subject selection", {
    picked: subjectIds.length,
    subjectIds,
  });

  if (subjectIds.length === 0) {
    console.log("[WEEKLY_CHALLENGE] No subjects selected — skipping generation", { userId });
    return { ok: false, error: "Pilih mapel dulu di Settings untuk tantangan mingguan." };
  }

  const subjectInputs: WeeklySubjectInput[] = [];
  for (const id of subjectIds) {
    const input = await buildWeeklySubjectInput(userId, id, new Date());
    if (input) subjectInputs.push(input);
  }

  if (subjectInputs.length === 0) {
    return { ok: false, error: "Mapel tidak valid" };
  }

  const aiTitle = await generateWeeklyTitleAI({
    userName: profile.user?.name ?? undefined,
    grade: profile.grade,
    subjectNames: subjectInputs.map((s) => s.subjectName),
  }).catch(() => ({
    title: `Misi Mingguan: ${subjectInputs[0]?.subjectName ?? "Pemburu Ilmu"}`,
    description:
      "Selesaikan semua item tantangan mingguan untuk klaim reward 100 XP!",
  }));

  let totalGoal = 0;
  const allContent: Array<{
    subjectInput: WeeklySubjectInput;
    counts: WeeklyItemCounts;
    questions: Array<{
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      hint: string;
      bloomTaxonomy: string;
    }>;
    materials: Array<{
      title: string;
      content: string;
      keyPoints: string[];
      estimatedMinutes: number;
    }>;
  }> = [];

  type RawWeeklyQuestion = {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    hint: string;
  };

  for (let idx = 0; idx < MAX_CHALLENGE_SUBJECTS; idx++) {
    const input = subjectInputs[idx % subjectInputs.length];
    console.log(
      `[WEEKLY_CHALLENGE] Processing challenge ${idx + 1}/${MAX_CHALLENGE_SUBJECTS}`,
      {
        subjectId: input.subjectId,
        subjectName: input.subjectName,
        avgMastery: input.avgMastery,
      },
    );

    const strength = classifyStrength(input.avgMastery);
    const counts = computeWeeklyItemCounts(strength);
    console.log(`[WEEKLY_CHALLENGE] Item counts for ${input.subjectName}`, {
      strength,
      questions: counts.questions,
      materials: counts.materials,
    });

    totalGoal += counts.questions + counts.materials;

    const aiContent = await generateWeeklyPerSubjectAI({
      subjectName: input.subjectName,
      subjectSlug: input.subjectSlug,
      learningStyle: profile.learningStyle ?? undefined,
      strength,
      questionsCount: counts.questions,
      materialsCount: counts.materials,
    }).catch((err) => {
      console.error("generateWeeklyPerSubjectAI failed:", err);
      return {
        questions: [] as RawWeeklyQuestion[],
        materials: [] as Array<{
          title: string;
          content: string;
          keyPoints: string[];
          estimatedMinutes: number;
        }>,
      };
    });

    const validQuestions = (aiContent.questions as RawWeeklyQuestion[])
      .filter(
        (q) =>
          q.questionText &&
          q.correctAnswer &&
          Array.isArray(q.options) &&
          q.options.includes(q.correctAnswer),
      )
      .slice(0, counts.questions);

    const validMaterials = aiContent.materials
      .filter((m) => m.title && m.content)
      .slice(0, counts.materials);

    let retries = 0;
    while (validQuestions.length < counts.questions && retries < MAX_RETRIES) {
      retries++;
      const quota = await incrementAiQuota(userId, "questions", 1);
      if (!quota.allowed) break;
      const fallback = await generateWeeklyPerSubjectAI({
        subjectName: input.subjectName,
        subjectSlug: input.subjectSlug,
        learningStyle: profile.learningStyle ?? undefined,
        strength,
        questionsCount: 1,
        materialsCount: 0,
      }).catch(() => ({
        questions: [] as RawWeeklyQuestion[],
        materials: [] as Array<{
          title: string;
          content: string;
          keyPoints: string[];
          estimatedMinutes: number;
        }>,
      }));
      const q = fallback.questions[0];
      if (q && q.options?.includes(q.correctAnswer)) {
        validQuestions.push(q);
      } else {
        // 🔴 Kembalikan quota kalo gagal
        await decrementAiQuota(userId, "questions", 1);
        break;
      }
    }

    retries = 0;
    while (validMaterials.length < counts.materials && retries < MAX_RETRIES) {
      retries++;
      const quota = await incrementAiQuota(userId, "materials", 1);
      if (!quota.allowed) break;
      const conceptSeed = validMaterials[0]?.title ?? input.subjectName;
      const material = await generateWeeklyDeepMaterial({
        subjectName: input.subjectName,
        conceptName: conceptSeed,
        learningStyle: profile.learningStyle ?? undefined,
        masteryScore: input.avgMastery,
      }).catch(() => null);
      if (material) {
        validMaterials.push({
          title: material.title,
          content: material.content,
          keyPoints: material.keyPoints,
          estimatedMinutes: material.estimatedMinutes,
        });
      } else {
        // 🔴 Kembalikan quota kalo gagal
        await decrementAiQuota(userId, "materials", 1);

        break;
      }
    }

    allContent.push({
      subjectInput: input,
      counts,
      questions: validQuestions.map((q) => ({
        ...q,
        bloomTaxonomy: "ANALYZE",
      })),
      materials: validMaterials,
    });
  }

  console.log("[WEEKLY_CHALLENGE] Content generation complete", {
    userId,
    totalChallenges: allContent.length,
    totalGoal,
  });

  const challengesCreated: string[] = [];
  let weeklyId: string | null = null;
  await prisma.$transaction(async (tx) => {
    for (let blockIdx = 0; blockIdx < allContent.length; blockIdx++) {
      const block = allContent[blockIdx];
      const subjectId = block.subjectInput.subjectId;
      const subjectName = block.subjectInput.subjectName;
      const firstQ = block.questions[0];
      const title = firstQ
        ? `Misi Mingguan ${subjectName}: ${firstQ.questionText.slice(0, 60)}`
        : `Misi Mingguan ${subjectName}: Deep Dive`;

      const challenge = await tx.challenge.create({
        data: {
          userId,
          subjectId,
          title,
          description: `Paket tantangan mingguan untuk ${subjectName}. Selesaikan semua item untuk klaim reward mingguan.`,
          type: "WEEKLY",
          status: "ACTIVE",
          source: "AUTO_WEEKLY",
          scheduledFor: monday,
          mixConfig: {
            questions: block.questions.length,
            materials: block.materials.length,
            reflections: 0,
          },
        },
      });
      challengesCreated.push(challenge.id);

      let order = 0;

      for (let qIdx = 0; qIdx < block.questions.length; qIdx++) {
        const q = block.questions[qIdx];
        const concept = await tx.concept.findFirst({
          where: { topic: { subjectId } },
          select: { id: true },
          orderBy: { order: "asc" },
        });
        if (!concept) continue;

        const bloom = BLOOMS[(blockIdx + qIdx) % BLOOMS.length] ?? "ANALYZE";

        const questionRecord = await tx.question.create({
          data: {
            conceptId: concept.id,
            type: "MULTIPLE_CHOICE",
            difficulty: "HARD",
            bloomTaxonomy: bloom,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            hint: q.hint,
            tags: ["weekly-challenge", "ai-generated", "deep-dive"],
            isActive: true,
          },
        });

        await tx.challengeItem.create({
          data: {
            challengeId: challenge.id,
            order: order++,
            kind: "QUESTION",
            questionId: questionRecord.id,
            points: 20,
          },
        });
      }

      for (const m of block.materials) {
        const materialRecord = await tx.material.create({
          data: {
            userId,
            subjectId,
            title: m.title,
            content: m.content,
            keyPoints: m.keyPoints,
            difficulty: "HARD",
            estimatedMinutes: m.estimatedMinutes,
            source: "CHALLENGE",
          },
        });

        await tx.challengeItem.create({
          data: {
            challengeId: challenge.id,
            order: order++,
            kind: "MATERIAL",
            materialId: materialRecord.id,
            points: 15,
          },
        });
      }
    }

    if (challengesCreated.length > 0) {
      const weekly = await tx.weeklyChallenge.create({
        data: {
          userId,
          weekStart: monday,
          title: aiTitle.title,
          description: aiTitle.description,
          goal: totalGoal,
          progress: 0,
          completed: false,
          xpRewarded: false,
          challengeId: challengesCreated[0],
        },
      });
      weeklyId = weekly.id;
    }
  });

  if (challengesCreated.length === 0) {
    console.log("[WEEKLY_CHALLENGE] No challenges created", { userId });
    return { ok: false, error: "Gagal membuat tantangan mingguan" };
  }

  console.log("[WEEKLY_CHALLENGE] Transaction complete", {
    userId,
    challengesCreated: challengesCreated.length,
    challengeIds: challengesCreated,
  });

  // UX-FIX: Don't call revalidatePath here — callers handle revalidation.
  // Calling revalidatePath during render causes Next.js errors.

    console.log("[WEEKLY_CHALLENGE] ✓ Complete", {
      userId,
      weeklyChallengeId: weeklyId,
      totalChallenges: challengesCreated.length,
    });

    return { ok: true, weeklyChallengeId: weeklyId ?? undefined };
  } finally {
    releaseDbLock(userId, "WEEKLY");
  }
}
