"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { XP_REWARDS } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import {
  addXp,
  checkAndUnlockBadges,
  recordActivity,
} from "@/server/actions/gamification";
import { recordQuestionAttempt } from "@/server/actions/subjects";
import {
  analyzeReflection,
  type ChallengeMix,
  generateDailyMix,
  generateOnDemandChallenge,
  generateWeeklyChallengeAI,
} from "@/server/ai/challenge";
import type {
  ChallengeItemKind,
  ChallengeItemStatus,
  ChallengeSource,
  ChallengeStatus,
  Prisma,
  ReflectionDepth,
  SubjectSlug,
} from "../../../generated/prisma/client";

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "STUDENT") throw new Error("FORBIDDEN");
  return session.user.id;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface ChallengeListItem {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  source: ChallengeSource;
  scheduledFor: string;
  generatedAt: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: SubjectSlug;
    icon: string | null;
    color: string | null;
  } | null;
  itemCount: number;
  completedItemCount: number;
  totalPoints: number;
  mixConfig: ChallengeMix;
}

export interface ChallengeDetailItem {
  id: string;
  order: number;
  kind: ChallengeItemKind;
  status: ChallengeItemStatus;
  points: number;
  completedAt: string | null;
  prompt: string | null;
  answer: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    hint: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    conceptName: string;
    topicName: string;
  } | null;
  material: {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    estimatedMinutes: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  } | null;
}

export interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  source: ChallengeSource;
  scheduledFor: string;
  generatedAt: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: SubjectSlug;
    icon: string | null;
    color: string | null;
  } | null;
  mixConfig: ChallengeMix;
  items: ChallengeDetailItem[];
  reflection: {
    id: string;
    prompt: string;
    response: string;
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    depth: "SURFACE" | "MODERATE" | "DEEP";
    suggestions: string[] | null;
    submittedAt: string;
  } | null;
}

export async function getTodayChallenges(): Promise<{
  challenges: ChallengeListItem[];
  progress: { total: number; completed: number; points: number };
}> {
  const userId = await requireStudent();
  const today = startOfToday();

  let challenges = await fetchChallengesForDate(userId, today);

  if (challenges.length === 0) {
    await generateAndStoreDailyChallenges(userId, today);
    challenges = await fetchChallengesForDate(userId, today);
  }

  await aggregateDailyProgress(userId, today);

  const total = challenges.length;
  const completed = challenges.filter((c) => c.status === "COMPLETED").length;
  const points = challenges.reduce(
    (acc, c) => acc + (c.status === "COMPLETED" ? c.totalPoints + 25 : 0),
    0,
  );

  return {
    challenges,
    progress: {
      total,
      completed,
      points,
    },
  };
}

async function fetchChallengesForDate(
  userId: string,
  date: Date,
): Promise<ChallengeListItem[]> {
  const dayStart = toDateOnly(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const rows = await prisma.challenge.findMany({
    where: {
      userId,
      scheduledFor: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { generatedAt: "asc" },
    include: {
      subject: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
      items: { select: { id: true, status: true, points: true } },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    source: c.source,
    scheduledFor: c.scheduledFor.toISOString(),
    generatedAt: c.generatedAt.toISOString(),
    completedAt: c.completedAt?.toISOString() ?? null,
    subject: c.subject
      ? { ...c.subject, slug: c.subject.slug as SubjectSlug }
      : null,
    itemCount: c.items.length,
    completedItemCount: c.items.filter((i) => i.status === "COMPLETED").length,
    totalPoints: c.items.reduce((acc, i) => acc + i.points, 0),
    mixConfig: c.mixConfig as ChallengeMix,
  }));
}

async function generateAndStoreDailyChallenges(
  userId: string,
  date: Date,
): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      grade: true,
      school: true,
      learningStyle: true,
      focusedSubjects: true,
      user: { select: { name: true } },
    },
  });

  const focusedSubjectIds = profile?.focusedSubjects ?? [];

  // Fetch focused subject details (names)
  const focusedSubjectModels =
    focusedSubjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: focusedSubjectIds } },
          select: { name: true },
        })
      : [];
  const focusedSubjectNames = focusedSubjectModels.map((s) => s.name);

  const [weakConcepts, strongConcepts, recentChallenges, availableQuestions] =
    await Promise.all([
      prisma.studentKnowledgeProfile.findMany({
        where: {
          userId,
          masteryScore: { lt: 0.7 },
          ...(focusedSubjectIds.length > 0 && {
            concept: {
              topic: {
                subjectId: { in: focusedSubjectIds },
              },
            },
          }),
        },
        orderBy: { masteryScore: "asc" },
        take: 8,
        include: {
          concept: {
            select: {
              id: true,
              name: true,
              topic: { select: { subject: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.studentKnowledgeProfile.findMany({
        where: {
          userId,
          masteryScore: { gte: 0.8 },
          ...(focusedSubjectIds.length > 0 && {
            concept: {
              topic: {
                subjectId: { in: focusedSubjectIds },
              },
            },
          }),
        },
        orderBy: { masteryScore: "desc" },
        take: 5,
        include: {
          concept: {
            select: {
              id: true,
              name: true,
              topic: { select: { subject: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.challenge.findMany({
        where: {
          userId,
          scheduledFor: {
            gte: new Date(date.getTime() - 5 * 24 * 60 * 60 * 1000),
            lt: date,
          },
        },
        orderBy: { scheduledFor: "desc" },
        take: 5,
        include: { items: { select: { kind: true } } },
      }),
      prisma.question.findMany({
        where: {
          isActive: true,
          ...(focusedSubjectIds.length > 0 && {
            concept: {
              topic: {
                subjectId: { in: focusedSubjectIds },
              },
            },
          }),
        },
        take: 60,
        select: {
          id: true,
          conceptId: true,
          difficulty: true,
          concept: {
            select: {
              name: true,
              topic: {
                select: {
                  name: true,
                  subject: { select: { slug: true } },
                },
              },
            },
          },
        },
      }),
    ]);

  const focusedSubjects = focusedSubjectNames;

  // Adaptive learning: dynamically compute challenge composition based on student's ability/performance
  let mixConfig = { questions: 3, materials: 2, reflections: 2 }; // Default: 7 items

  if (weakConcepts.length > 3) {
    // User has multiple weaknesses: focus on explanation/review (more materials)
    mixConfig = {
      questions: 3,
      materials: 3,
      reflections: 2, // Total: 8 items
    };
  } else if (weakConcepts.length === 0 && strongConcepts.length > 5) {
    // Advanced user: focus heavily on application and critical thinking (more questions/reflections)
    mixConfig = {
      questions: 4,
      materials: 1,
      reflections: 3, // Total: 8 items
    };
  } else {
    // Balanced profile
    mixConfig = {
      questions: 4,
      materials: 2,
      reflections: 2, // Total: 8 items
    };
  }

  try {
    const plan = await generateDailyMix({
      userId,
      userName: profile?.user.name ?? undefined,
      grade: profile?.grade,
      school: profile?.school,
      learningStyle: profile?.learningStyle,
      focusedSubjects,
      weakConcepts: weakConcepts.map((w) => ({
        id: w.concept.id,
        name: w.concept.name,
        masteryScore: w.masteryScore,
        subjectName: w.concept.topic.subject.name,
      })),
      strongConcepts: strongConcepts.map((s) => ({
        id: s.concept.id,
        name: s.concept.name,
        masteryScore: s.masteryScore,
        subjectName: s.concept.topic.subject.name,
      })),
      recentChallenges: recentChallenges.map((c) => ({
        title: c.title,
        kinds: Array.from(new Set(c.items.map((i) => i.kind))),
      })),
      availableQuestions: availableQuestions.map((q) => ({
        id: q.id,
        conceptId: q.conceptId,
        conceptName: q.concept.name,
        topicName: q.concept.topic.name,
        subjectSlug: q.concept.topic.subject.slug,
        difficulty: q.difficulty,
      })),
      mix: mixConfig,
    });

    await prisma.$transaction(async (tx) => {
      const uniqueSlugs = Array.from(
        new Set(plan.items.map((i) => i.subjectSlug)),
      );
      const subjects = await tx.subject.findMany({
        where: { slug: { in: uniqueSlugs as never[] } },
        select: { id: true, slug: true, name: true },
      });
      const subjectIdBySlug = new Map(subjects.map((s) => [s.slug, s.id]));
      const subjectNameBySlug = new Map(subjects.map((s) => [s.slug, s.name]));

      // Group items by subjectSlug
      const itemsBySubject = new Map<string, typeof plan.items>();
      for (const item of plan.items) {
        const list = itemsBySubject.get(item.subjectSlug) || [];
        list.push(item);
        itemsBySubject.set(item.subjectSlug, list);
      }

      for (const [subjectSlug, subjectItems] of itemsBySubject.entries()) {
        const subjectId =
          subjectIdBySlug.get(subjectSlug as SubjectSlug) ?? null;
        const subjectName =
          subjectNameBySlug.get(subjectSlug as SubjectSlug) ||
          subjectSlug
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());

        const firstConcept =
          subjectItems.find((i) => i.conceptHint)?.conceptHint ||
          "Pembelajaran Adaptif";
        const title = `Tantangan ${subjectName}: ${firstConcept}`;
        const description = `Paket belajar harian: baca materi, selesaikan latihan soal, dan tulis refleksi untuk meningkatkan penguasaan konsep.`;

        const challengeMix = {
          questions: subjectItems.filter((i) => i.kind === "QUESTION").length,
          materials: subjectItems.filter((i) => i.kind === "MATERIAL").length,
          reflections: subjectItems.filter((i) => i.kind === "REFLECTION")
            .length,
        };

        const challenge = await tx.challenge.create({
          data: {
            userId,
            subjectId,
            title,
            description,
            status: "ACTIVE",
            source: "AUTO_DAILY",
            scheduledFor: toDateOnly(date),
            mixConfig: challengeMix,
          },
        });

        for (let idx = 0; idx < subjectItems.length; idx++) {
          const item = subjectItems[idx];
          if (item.kind === "QUESTION") {
            const candidates = availableQuestions.filter(
              (q) => q.concept.topic.subject.slug === item.subjectSlug,
            );
            const picked =
              candidates[idx % candidates.length] ||
              availableQuestions[idx % availableQuestions.length];
            if (picked) {
              await tx.challengeItem.create({
                data: {
                  challengeId: challenge.id,
                  order: idx,
                  kind: "QUESTION",
                  questionId: picked.id,
                  points: 10,
                },
              });
            }
          } else if (item.kind === "MATERIAL" && item.material) {
            const mat = await tx.material.create({
              data: {
                userId,
                subjectId: subjectId,
                title: item.material.title,
                content: item.material.content,
                keyPoints: item.material.keyPoints,
                estimatedMinutes: item.material.estimatedMinutes,
                difficulty: item.material.difficulty,
                source: "CHALLENGE",
              },
            });
            await tx.challengeItem.create({
              data: {
                challengeId: challenge.id,
                order: idx,
                kind: "MATERIAL",
                materialId: mat.id,
                points: 5,
              },
            });
          } else if (item.kind === "REFLECTION" && item.reflection) {
            await tx.challengeItem.create({
              data: {
                challengeId: challenge.id,
                order: idx,
                kind: "REFLECTION",
                prompt: `${item.reflection.prompt}\n\nKonteks: ${item.reflection.context}`,
                points: 15,
              },
            });
          }
        }
      }
    });
  } catch (err) {
    console.error("generateAndStoreDailyChallenges failed:", err);
    throw err;
  }
}

export async function getChallengeDetail(
  challengeId: string,
): Promise<ChallengeDetail | null> {
  const userId = await requireStudent();

  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, userId },
    include: {
      subject: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              options: true,
              correctAnswer: true,
              explanation: true,
              hint: true,
              difficulty: true,
              concept: {
                select: { name: true, topic: { select: { name: true } } },
              },
            },
          },
          material: {
            select: {
              id: true,
              title: true,
              content: true,
              keyPoints: true,
              estimatedMinutes: true,
              difficulty: true,
            },
          },
        },
      },
      reflections: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!challenge) return null;

  const reflection = challenge.reflections[0] ?? null;

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    status: challenge.status,
    source: challenge.source,
    scheduledFor: challenge.scheduledFor.toISOString(),
    generatedAt: challenge.generatedAt.toISOString(),
    completedAt: challenge.completedAt?.toISOString() ?? null,
    subject: challenge.subject
      ? { ...challenge.subject, slug: challenge.subject.slug as SubjectSlug }
      : null,
    mixConfig: challenge.mixConfig as ChallengeMix,
    items: challenge.items.map((item) => ({
      id: item.id,
      order: item.order,
      kind: item.kind,
      status: item.status,
      points: item.points,
      completedAt: item.completedAt?.toISOString() ?? null,
      prompt: item.prompt,
      answer: item.answer,
      isCorrect: item.isCorrect,
      question: item.question
        ? {
            id: item.question.id,
            questionText: item.question.questionText,
            options: Array.isArray(item.question.options)
              ? (item.question.options as unknown as string[])
              : [],
            correctAnswer: item.question.correctAnswer,
            explanation: item.question.explanation,
            hint: item.question.hint,
            difficulty: item.question.difficulty,
            conceptName: item.question.concept.name,
            topicName: item.question.concept.topic.name,
          }
        : null,
      material: item.material
        ? {
            id: item.material.id,
            title: item.material.title,
            content: item.material.content,
            keyPoints: Array.isArray(item.material.keyPoints)
              ? (item.material.keyPoints as unknown as string[])
              : [],
            estimatedMinutes: item.material.estimatedMinutes,
            difficulty: item.material.difficulty,
          }
        : null,
    })),
    reflection: reflection
      ? {
          id: reflection.id,
          prompt: reflection.prompt,
          response: reflection.response,
          sentiment: reflection.sentiment,
          depth: reflection.depth,
          suggestions: Array.isArray(reflection.suggestions)
            ? (reflection.suggestions as unknown as string[])
            : null,
          submittedAt: reflection.submittedAt.toISOString(),
        }
      : null,
  };
}

const completeSchema = z.object({
  itemId: z.string().min(1),
  answer: z.string().min(1).max(4000).optional(),
});

export async function completeChallengeItem(input: {
  itemId: string;
  answer?: string;
}): Promise<{
  ok: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string | null;
  newMastery?: number;
  newStatus?: string;
  challengeCompleted?: boolean;
  error?: string;
  unlockedBadges?: any[];
}> {
  const userId = await requireStudent();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input tidak valid" };

  const item = await prisma.challengeItem.findFirst({
    where: { id: parsed.data.itemId, challenge: { userId } },
    include: {
      challenge: true,
      question: { select: { correctAnswer: true, explanation: true } },
      material: { select: { id: true } },
    },
  });

  if (!item) return { ok: false, error: "Item tidak ditemukan" };
  if (item.status === "COMPLETED") {
    return { ok: false, error: "Item sudah selesai" };
  }

  if (item.kind === "QUESTION") {
    if (!parsed.data.answer) {
      return { ok: false, error: "Jawaban wajib diisi" };
    }
    if (!item.question) {
      return { ok: false, error: "Soal tidak ditemukan" };
    }

    const isCorrect =
      parsed.data.answer.trim() === item.question.correctAnswer.trim();

    await prisma.challengeItem.update({
      where: { id: item.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        answer: parsed.data.answer,
        isCorrect,
      },
    });

    if (item.questionId) {
      await recordQuestionAttempt({
        questionId: item.questionId,
        answer: parsed.data.answer,
        isCorrect,
      });
    }

    if (isCorrect) {
      await addXp(userId, XP_REWARDS.ANSWER_CORRECT, "ANSWER_CORRECT", {
        questionId: item.questionId,
        challengeItemId: item.id,
      });
    }

    const challengeCompleted = await checkAndCompleteChallenge(
      item.challengeId,
    );
    await aggregateDailyProgress(userId, item.challenge.scheduledFor);
    await updateWeeklyChallengeProgress(userId).catch(console.error);
    await recordActivity(userId);
    const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);
    revalidatePath("/challenge", "layout");
    revalidatePath("/dashboard", "layout");

    return {
      ok: true,
      isCorrect,
      correctAnswer: item.question.correctAnswer,
      explanation: item.question.explanation,
      challengeCompleted,
      unlockedBadges,
    };
  }

  if (item.kind === "MATERIAL") {
    if (item.material) {
      await markMaterialReadInternal(userId, item.material.id, true);
    }
    await prisma.challengeItem.update({
      where: { id: item.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await addXp(userId, XP_REWARDS.CHAT_SESSION, "CHAT_SESSION", {
      challengeItemId: item.id,
      kind: "MATERIAL",
    });
    const challengeCompleted = await checkAndCompleteChallenge(
      item.challengeId,
    );
    await aggregateDailyProgress(userId, item.challenge.scheduledFor);
    await updateWeeklyChallengeProgress(userId).catch(console.error);
    await recordActivity(userId);
    const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);
    revalidatePath("/challenge", "layout");
    return { ok: true, challengeCompleted, unlockedBadges };
  }

  if (item.kind === "REFLECTION") {
    return { ok: false, error: "Gunakan submitReflection untuk refleksi" };
  }

  return { ok: false, error: "Tipe item tidak dikenal" };
}

export async function skipChallengeItem(input: {
  itemId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireStudent();
  const item = await prisma.challengeItem.findFirst({
    where: { id: input.itemId, challenge: { userId } },
  });
  if (!item) return { ok: false, error: "Item tidak ditemukan" };
  await prisma.challengeItem.update({
    where: { id: item.id },
    data: { status: "SKIPPED", completedAt: new Date() },
  });
  await checkAndCompleteChallenge(item.challengeId);
  revalidatePath("/challenge", "layout");
  return { ok: true };
}

const reflectionSchema = z.object({
  challengeId: z.string().min(1),
  response: z.string().min(20).max(2000),
});

export async function submitReflection(input: {
  challengeId: string;
  response: string;
}): Promise<{
  ok: boolean;
  analysis?: { sentiment: string; depth: string; suggestions: string[] };
  error?: string;
  unlockedBadges?: any[];
}> {
  const userId = await requireStudent();
  const parsed = reflectionSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Refleksi minimal 20 karakter" };

  const challenge = await prisma.challenge.findFirst({
    where: { id: parsed.data.challengeId, userId },
    include: {
      subject: { select: { name: true } },
      items: { where: { kind: "REFLECTION" }, take: 1 },
    },
  });

  if (!challenge) return { ok: false, error: "Challenge tidak ditemukan" };
  const reflectionItem = challenge.items[0];
  if (!reflectionItem || !reflectionItem.prompt) {
    return { ok: false, error: "Challenge ini tidak punya refleksi" };
  }

  const analysis = await analyzeReflection(
    reflectionItem.prompt,
    parsed.data.response,
    challenge.subject?.name,
  );

  await prisma.reflection.create({
    data: {
      userId,
      challengeId: challenge.id,
      prompt: reflectionItem.prompt,
      response: parsed.data.response,
      sentiment: analysis.sentiment,
      depth: analysis.depth,
      suggestions: analysis.suggestions,
    },
  });

  await prisma.challengeItem.update({
    where: { id: reflectionItem.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      answer: parsed.data.response,
    },
  });

  await addXp(userId, 15, "DAILY_QUEST", {
    challengeId: challenge.id,
    kind: "REFLECTION",
  });

  const _completedAfter = await checkAndCompleteChallenge(challenge.id);
  await aggregateDailyProgress(userId, challenge.scheduledFor);
  await updateWeeklyChallengeProgress(userId).catch(console.error);
  await recordActivity(userId);
  const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);
  revalidatePath("/challenge", "layout");
  revalidatePath(`/challenge/${challenge.id}`, "layout");
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    analysis: {
      sentiment: analysis.sentiment,
      depth: analysis.depth,
      suggestions: analysis.suggestions,
    },
    unlockedBadges,
  };
}

async function checkAndCompleteChallenge(
  challengeId: string,
): Promise<boolean> {
  const items = await prisma.challengeItem.findMany({
    where: { challengeId },
    select: { status: true },
  });
  const allDone = items.every(
    (i) => i.status === "COMPLETED" || i.status === "SKIPPED",
  );
  if (allDone) {
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
  return allDone;
}

const markReadSchema = z.object({
  materialId: z.string().min(1),
  readSeconds: z.number().int().min(0).max(3600).default(0),
  completed: z.boolean().default(false),
});

export async function markMaterialRead(input: {
  materialId: string;
  readSeconds?: number;
  completed?: boolean;
}): Promise<{ ok: boolean; error?: string; unlockedBadges?: any[] }> {
  const userId = await requireStudent();
  const parsed = markReadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input tidak valid" };

  const material = await prisma.material.findFirst({
    where: { id: parsed.data.materialId, userId },
  });
  if (!material) return { ok: false, error: "Materi tidak ditemukan" };

  const existingRead = await prisma.materialRead.findUnique({
    where: { userId_materialId: { userId, materialId: parsed.data.materialId } },
  });
  const wasAlreadyCompleted = existingRead?.completed ?? false;

  await markMaterialReadInternal(
    userId,
    parsed.data.materialId,
    parsed.data.completed,
    parsed.data.readSeconds,
  );

  let unlockedBadges: any[] = [];
  if (parsed.data.completed) {
    if (!wasAlreadyCompleted) {
      await addXp(userId, 10, "CHAT_SESSION", {
        materialId: parsed.data.materialId,
        source: "LIBRARY_READ",
      }).catch(console.error);
    }
    await recordActivity(userId).catch(console.error);
    unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);
  }

  revalidatePath("/materials", "layout");
  return { ok: true, unlockedBadges };
}

async function markMaterialReadInternal(
  userId: string,
  materialId: string,
  completed: boolean,
  readSeconds = 0,
) {
  await prisma.materialRead.upsert({
    where: { userId_materialId: { userId, materialId } },
    create: {
      userId,
      materialId,
      readSeconds,
      completed,
    },
    update: {
      readSeconds: { increment: readSeconds },
      completed: completed || undefined,
    },
  });
}

const generateSchema = z.object({
  kind: z.enum(["QUESTION", "MATERIAL", "REFLECTION", "MIX"]).default("MIX"),
  subjectSlug: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export async function generateOnDemand(input: {
  kind?: "QUESTION" | "MATERIAL" | "REFLECTION" | "MIX";
  subjectSlug?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}): Promise<{ ok: boolean; challengeId?: string; error?: string }> {
  const userId = await requireStudent();
  const parsed = generateSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Input tidak valid" };

  const today = startOfToday();
  const todayCount = await prisma.challenge.count({
    where: {
      userId,
      source: "ON_DEMAND",
      scheduledFor: { gte: today, lt: new Date(today.getTime() + 86_400_000) },
    },
  });
  if (todayCount >= 10) {
    return {
      ok: false,
      error:
        "Batas tantangan tambahan hari ini sudah tercapai (10x). Coba lagi besok ya!",
    };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { focusedSubjects: true },
  });

  const focusedSubjectIds = profile?.focusedSubjects ?? [];

  // Fetch focused subject details (names)
  const focusedSubjectModels =
    focusedSubjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: focusedSubjectIds } },
          select: { name: true },
        })
      : [];
  const focusedSubjectNames = focusedSubjectModels.map((s) => s.name);

  // If specific subject is requested
  const subjectSlug = parsed.data.subjectSlug;
  const subject = subjectSlug
    ? await prisma.subject.findUnique({
        where: { slug: subjectSlug as SubjectSlug },
      })
    : null;

  // Build filter for availableQuestions
  const availableQuestionsFilter: Prisma.QuestionWhereInput = {
    isActive: true,
  };
  if (subject) {
    availableQuestionsFilter.concept = {
      topic: {
        subjectId: subject.id,
      },
    };
  } else if (focusedSubjectIds.length > 0) {
    availableQuestionsFilter.concept = {
      topic: {
        subjectId: { in: focusedSubjectIds },
      },
    };
  }

  const availableQuestions = await prisma.question.findMany({
    where: availableQuestionsFilter,
    take: 30,
    select: {
      id: true,
      conceptId: true,
      difficulty: true,
      concept: {
        select: {
          name: true,
          topic: {
            select: { name: true, subject: { select: { slug: true } } },
          },
        },
      },
    },
  });

  try {
    const plan = await generateOnDemandChallenge({
      userId,
      kind: parsed.data.kind,
      subjectSlug: parsed.data.subjectSlug,
      difficulty: parsed.data.difficulty,
      focusedSubjects: focusedSubjectNames,
      availableQuestions: availableQuestions.map((q) => ({
        id: q.id,
        conceptId: q.conceptId,
        conceptName: q.concept.name,
        topicName: q.concept.topic.name,
        subjectSlug: q.concept.topic.subject.slug,
        difficulty: q.difficulty,
      })),
    });

    if (plan.items.length === 0)
      return { ok: false, error: "AI gagal generate tantangan" };

    const firstItem = plan.items[0];
    const slugToLookup = parsed.data.subjectSlug ?? firstItem.subjectSlug;
    const subject = slugToLookup
      ? await prisma.subject.findUnique({
          where: { slug: slugToLookup as SubjectSlug },
          select: { id: true, name: true },
        })
      : null;

    const challengeMix = {
      questions: plan.items.filter((i) => i.kind === "QUESTION").length,
      materials: plan.items.filter((i) => i.kind === "MATERIAL").length,
      reflections: plan.items.filter((i) => i.kind === "REFLECTION").length,
    };

    const firstConcept =
      plan.items.find((i) => i.conceptHint)?.conceptHint ||
      "Pembelajaran Adaptif";
    const _subjectName =
      subject?.name ??
      (slugToLookup
        ? slugToLookup
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Adaptif");

    const baseData = {
      userId,
      subjectId: subject?.id ?? null,
      title: `Tantangan Tambahan: ${firstConcept}`,
      description:
        plan.description || "Latihan adaptif tambahan atas permintaan siswa.",
      status: "ACTIVE" as const,
      source: "ON_DEMAND" as const,
      scheduledFor: toDateOnly(today),
      mixConfig: challengeMix,
    };

    const challenge = await prisma.challenge.create({ data: baseData });

    for (let idx = 0; idx < plan.items.length; idx++) {
      const item = plan.items[idx];
      if (item.kind === "QUESTION") {
        const candidates = availableQuestions.filter(
          (q) =>
            (q.concept.topic.subject as { slug: SubjectSlug }).slug ===
            item.subjectSlug,
        );
        const fallback =
          candidates[idx % candidates.length] ||
          availableQuestions[idx % availableQuestions.length];
        if (fallback) {
          await prisma.challengeItem.create({
            data: {
              challengeId: challenge.id,
              order: idx,
              kind: "QUESTION",
              questionId: fallback.id,
              points: 10,
            },
          });
        }
      } else if (item.kind === "MATERIAL" && item.material) {
        const m = await prisma.material.create({
          data: {
            userId,
            subjectId: subject?.id ?? null,
            title: item.material.title,
            content: item.material.content,
            keyPoints: item.material.keyPoints,
            estimatedMinutes: item.material.estimatedMinutes,
            difficulty: item.material.difficulty,
            source: "ON_DEMAND",
          },
        });
        await prisma.challengeItem.create({
          data: {
            challengeId: challenge.id,
            order: idx,
            kind: "MATERIAL",
            materialId: m.id,
            points: 5,
          },
        });
      } else if (item.kind === "REFLECTION" && item.reflection) {
        await prisma.challengeItem.create({
          data: {
            challengeId: challenge.id,
            order: idx,
            kind: "REFLECTION",
            prompt: `${item.reflection.prompt}\n\nKonteks: ${item.reflection.context}`,
            points: 15,
          },
        });
      }
    }

    const challengeId = challenge.id;

    revalidatePath("/challenge", "layout");
    return { ok: true, challengeId };
  } catch (err) {
    console.error("generateOnDemand failed:", err);
    return { ok: false, error: "Gagal generate tantangan" };
  }
}

export async function getChallengeHistory(input: {
  limit?: number;
  offset?: number;
}): Promise<{
  items: ChallengeListItem[];
  total: number;
}> {
  const userId = await requireStudent();
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;

  const [rows, total] = await Promise.all([
    prisma.challenge.findMany({
      where: { userId },
      orderBy: { scheduledFor: "desc" },
      take: limit,
      skip: offset,
      include: {
        subject: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        items: { select: { id: true, status: true, points: true } },
      },
    }),
    prisma.challenge.count({ where: { userId } }),
  ]);

  return {
    total,
    items: rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      source: c.source,
      scheduledFor: c.scheduledFor.toISOString(),
      generatedAt: c.generatedAt.toISOString(),
      completedAt: c.completedAt?.toISOString() ?? null,
      subject: c.subject
        ? { ...c.subject, slug: c.subject.slug as SubjectSlug }
        : null,
      itemCount: c.items.length,
      completedItemCount: c.items.filter((i) => i.status === "COMPLETED")
        .length,
      totalPoints: c.items.reduce((acc, i) => acc + i.points, 0),
      mixConfig: c.mixConfig as ChallengeMix,
    })),
  };
}

export interface MaterialLibraryItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  source: "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE";
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: SubjectSlug;
    icon: string | null;
    color: string | null;
  } | null;
}

export async function getMaterialLibrary(input: {
  subjectId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: MaterialLibraryItem[]; total: number }> {
  const userId = await requireStudent();
  const limit = input.limit ?? 30;
  const offset = input.offset ?? 0;

  const [rows, total] = await Promise.all([
    prisma.material.findMany({
      where: {
        userId,
        subjectId: input.subjectId ?? undefined,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        subject: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        reads: { where: { userId }, take: 1, orderBy: { readAt: "desc" } },
      },
    }),
    prisma.material.count({
      where: { userId, subjectId: input.subjectId ?? undefined },
    }),
  ]);

  return {
    total,
    items: rows.map((m) => ({
      id: m.id,
      title: m.title,
      estimatedMinutes: m.estimatedMinutes,
      difficulty: m.difficulty,
      source: m.source,
      createdAt: m.createdAt.toISOString(),
      read: m.reads[0]
        ? {
            completed: m.reads[0].completed,
            readAt: m.reads[0].readAt.toISOString(),
            readSeconds: m.reads[0].readSeconds,
          }
        : null,
      subject: m.subject
        ? { ...m.subject, slug: m.subject.slug as SubjectSlug }
        : null,
    })),
  };
}

export interface MaterialDetail {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  source: "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE";
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: SubjectSlug;
    icon: string | null;
    color: string | null;
  } | null;
  relatedChallenges: Array<{
    id: string;
    title: string;
    status: ChallengeStatus;
  }>;
}

export async function getMaterialDetail(
  materialId: string,
): Promise<MaterialDetail | null> {
  const userId = await requireStudent();
  const material = await prisma.material.findFirst({
    where: { id: materialId, userId },
    include: {
      subject: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
      reads: { where: { userId }, take: 1, orderBy: { readAt: "desc" } },
      challengeItems: {
        include: {
          challenge: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });
  if (!material) return null;

  return {
    id: material.id,
    title: material.title,
    content: material.content,
    keyPoints: Array.isArray(material.keyPoints)
      ? (material.keyPoints as unknown as string[])
      : [],
    estimatedMinutes: material.estimatedMinutes,
    difficulty: material.difficulty,
    source: material.source,
    createdAt: material.createdAt.toISOString(),
    read: material.reads[0]
      ? {
          completed: material.reads[0].completed,
          readAt: material.reads[0].readAt.toISOString(),
          readSeconds: material.reads[0].readSeconds,
        }
      : null,
    subject: material.subject
      ? { ...material.subject, slug: material.subject.slug as SubjectSlug }
      : null,
    relatedChallenges: material.challengeItems.map((ci) => ({
      id: ci.challenge.id,
      title: ci.challenge.title,
      status: ci.challenge.status,
    })),
  };
}

export interface DailyProgress {
  date: string;
  totalActive: number;
  totalCompleted: number;
  totalPoints: number;
  questionsCompleted: number;
  materialsCompleted: number;
  reflectionsSubmitted: number;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
}

export async function getDailyProgress(date?: Date): Promise<DailyProgress> {
  const userId = await requireStudent();
  const targetDate = toDateOnly(date ?? new Date());

  let progress = await prisma.userChallengeProgress.findUnique({
    where: { userId_date: { userId, date: targetDate } },
  });

  if (!progress) {
    await aggregateDailyProgress(userId, targetDate);
    progress = await prisma.userChallengeProgress.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    });
  }

  const [mastery, materials, reflections] = await Promise.all([
    prisma.studentKnowledgeProfile.aggregate({
      where: { userId },
      _avg: { masteryScore: true },
    }),
    prisma.materialRead.count({
      where: {
        userId,
        completed: true,
        readAt: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 86_400_000),
        },
      },
    }),
    prisma.reflection.count({
      where: {
        userId,
        submittedAt: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 86_400_000),
        },
      },
    }),
  ]);

  const masteryScore = Math.round((mastery._avg.masteryScore ?? 0) * 100);
  const target = 4;
  const challengeScore = Math.min(
    100,
    Math.round(((progress?.totalCompleted ?? 0) / target) * 100),
  );
  const materialsScore = Math.min(100, materials * 33);
  const reflectionsScore = Math.min(100, reflections * 100);

  const overall = Math.round(
    masteryScore * 0.4 +
      challengeScore * 0.3 +
      materialsScore * 0.2 +
      reflectionsScore * 0.1,
  );

  return {
    date: targetDate.toISOString(),
    totalActive: progress?.totalActive ?? 0,
    totalCompleted: progress?.totalCompleted ?? 0,
    totalPoints: progress?.totalPoints ?? 0,
    questionsCompleted: progress?.questionsCompleted ?? 0,
    materialsCompleted: progress?.materialsCompleted ?? 0,
    reflectionsSubmitted: progress?.reflectionsSubmitted ?? 0,
    overallScore: overall,
    masteryScore,
    challengeScore,
    materialsScore,
    reflectionsScore,
  };
}

async function aggregateDailyProgress(
  userId: string,
  date: Date,
): Promise<void> {
  const dayStart = toDateOnly(date);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const [challenges, items] = await Promise.all([
    prisma.challenge.findMany({
      where: { userId, scheduledFor: { gte: dayStart, lt: dayEnd } },
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.challengeItem.findMany({
      where: {
        challenge: { userId, scheduledFor: { gte: dayStart, lt: dayEnd } },
        status: "COMPLETED",
        completedAt: { gte: dayStart, lt: dayEnd },
      },
      include: { challenge: { select: { scheduledFor: true } } },
    }),
  ]);

  const totalActive = challenges.length;
  const totalCompleted = challenges.filter(
    (c) => c.status === "COMPLETED",
  ).length;
  const totalPoints = items.reduce((acc, i) => acc + i.points, 0);
  const questionsCompleted = items.filter((i) => i.kind === "QUESTION").length;
  const materialsCompleted = items.filter((i) => i.kind === "MATERIAL").length;
  const reflectionsSubmitted = items.filter(
    (i) => i.kind === "REFLECTION",
  ).length;

  await prisma.userChallengeProgress.upsert({
    where: { userId_date: { userId, date: dayStart } },
    create: {
      userId,
      date: dayStart,
      totalActive,
      totalCompleted,
      totalPoints,
      pointsByKind: { question: 10, material: 5, reflection: 15 },
      questionsCompleted,
      materialsCompleted,
      reflectionsSubmitted,
    },
    update: {
      totalActive,
      totalCompleted,
      totalPoints,
      questionsCompleted,
      materialsCompleted,
      reflectionsSubmitted,
    },
  });
}

// ============================================================================
// §6.6.7 Progress Aggregation
// ============================================================================

const DEPTH_VALUE: Record<ReflectionDepth, number> = {
  SURFACE: 1,
  MODERATE: 2,
  DEEP: 3,
};

export type SubjectProgressBreakdown = {
  subjectId: string;
  subjectName: string;
  subjectSlug: SubjectSlug | null;
  masteryScore: number; // 0-100
  challengeScore: number; // 0-100
  materialsScore: number; // 0-100
  reflectionsScore: number; // 0-100
  overallScore: number; // 0-100 (weighted: mastery 40% / challenge 30% / materials 20% / reflections 10%)
  stats: {
    conceptsTracked: number;
    challengesCompleted: number;
    challengesTotal: number;
    materialsRead: number;
    readSeconds: number;
    reflectionsSubmitted: number;
    avgDepth: number | null; // 1=surface, 2=moderate, 3=deep
  };
};

export type StudentProgress = {
  userId: string;
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
  perSubject: SubjectProgressBreakdown[];
};

export type StudentProgressSummary = {
  userId: string;
  generatedAt: string;
  windowDays: number;
  overallScore: number;
  trend: "up" | "down" | "flat";
  streakDays: number;
  totalActiveSubjects: number;
  perSubject: SubjectProgressBreakdown[];
  highlights: {
    strongestSubject: SubjectProgressBreakdown | null;
    weakestSubject: SubjectProgressBreakdown | null;
    mostReadSubject: SubjectProgressBreakdown | null;
  };
};

export type ProgressTimelinePoint = {
  date: string; // YYYY-MM-DD
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
  challengesCompleted: number;
  materialsRead: number;
  reflectionsSubmitted: number;
};

export type ProgressTimeline = {
  userId: string;
  days: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  points: ProgressTimelinePoint[];
};

async function requireAccessToStudent(studentId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  if (session.user.role === "STUDENT") {
    if (session.user.id !== studentId) throw new Error("FORBIDDEN");
    return;
  }

  if (session.user.role === "PARENT") {
    const link = await prisma.parentStudentLink.findFirst({
      where: {
        parentId: session.user.id,
        studentId,
        status: "ACCEPTED",
      },
      select: { id: true },
    });
    if (!link) throw new Error("FORBIDDEN");
    return;
  }

  throw new Error("FORBIDDEN");
}

export async function aggregateStudentProgress(
  userId: string,
  windowDays = 7,
): Promise<StudentProgress> {
  await requireAccessToStudent(userId);

  const safeWindow = Math.max(1, Math.min(90, Math.floor(windowDays)));
  const now = new Date();
  const windowStart = new Date(now.getTime() - safeWindow * 86_400_000);

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId },
    select: {
      masteryScore: true,
      concept: {
        select: {
          topic: {
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  type SubjectBucket = {
    subject: { id: string; name: string; slug: SubjectSlug };
    masteryScores: number[];
  };
  const subjectMap = new Map<string, SubjectBucket>();

  for (const p of profiles) {
    const s = p.concept.topic.subject;
    const entry = subjectMap.get(s.id);
    if (entry) {
      entry.masteryScores.push(p.masteryScore);
    } else {
      subjectMap.set(s.id, {
        subject: { id: s.id, name: s.name, slug: s.slug as SubjectSlug },
        masteryScores: [p.masteryScore],
      });
    }
  }

  const recentChallengeSubjects = await prisma.challenge.findMany({
    where: { userId, scheduledFor: { gte: windowStart } },
    select: {
      subjectId: true,
      subject: { select: { id: true, name: true, slug: true } },
    },
  });
  for (const c of recentChallengeSubjects) {
    if (c.subject && !subjectMap.has(c.subject.id)) {
      subjectMap.set(c.subject.id, {
        subject: {
          id: c.subject.id,
          name: c.subject.name,
          slug: c.subject.slug as SubjectSlug,
        },
        masteryScores: [],
      });
    }
  }

  const subjectIds = Array.from(subjectMap.keys());

  if (subjectIds.length === 0) {
    return {
      userId,
      windowDays: safeWindow,
      windowStart: windowStart.toISOString(),
      windowEnd: now.toISOString(),
      overallScore: 0,
      masteryScore: 0,
      challengeScore: 0,
      materialsScore: 0,
      reflectionsScore: 0,
      perSubject: [],
    };
  }

  const [allChallenges, allSubjectMaterialReads, allSubjectReflections] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        userId,
        subjectId: { in: subjectIds },
        scheduledFor: { gte: windowStart },
      },
      select: { id: true, subjectId: true, status: true },
    }),
    prisma.materialRead.findMany({
      where: {
        userId,
        completed: true,
        readAt: { gte: windowStart },
        material: { subjectId: { in: subjectIds } },
      },
      select: { readSeconds: true, material: { select: { subjectId: true } } },
    }),
    prisma.reflection.findMany({
      where: {
        userId,
        submittedAt: { gte: windowStart },
        challenge: { subjectId: { in: subjectIds } },
      },
      select: { depth: true, challenge: { select: { subjectId: true } } },
    }),
  ]);

  const challengeMap = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const c of allChallenges) {
    if (!c.subjectId) continue;
    const entry = challengeMap.get(c.subjectId) ?? { total: 0, completed: 0 };
    entry.total++;
    if (c.status === "COMPLETED") entry.completed++;
    challengeMap.set(c.subjectId, entry);
  }

  const materialMap = new Map<string, { count: number; readSeconds: number }>();
  for (const m of allSubjectMaterialReads) {
    const sid = m.material.subjectId;
    if (!sid) continue;
    const entry = materialMap.get(sid) ?? { count: 0, readSeconds: 0 };
    entry.count++;
    entry.readSeconds += m.readSeconds;
    materialMap.set(sid, entry);
  }

  const reflectionMap = new Map<
    string,
    { count: number; depths: number[] }
  >();
  for (const r of allSubjectReflections) {
    const sid = r.challenge.subjectId;
    if (!sid) continue;
    const entry = reflectionMap.get(sid) ?? { count: 0, depths: [] };
    entry.count++;
    entry.depths.push(DEPTH_VALUE[r.depth] ?? 1);
    reflectionMap.set(sid, entry);
  }

  const perSubject = Array.from(subjectMap.values())
    .map(({ subject, masteryScores }): SubjectProgressBreakdown => {
      const masteryAvg =
        masteryScores.length > 0
          ? masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length
          : 0;
      const masteryScore = Math.round(masteryAvg * 100);

      const ch = challengeMap.get(subject.id) ?? {
        total: 0,
        completed: 0,
      };
      const mat = materialMap.get(subject.id) ?? {
        count: 0,
        readSeconds: 0,
      };
      const ref = reflectionMap.get(subject.id) ?? {
        count: 0,
        depths: [],
      };

      const challengeScore =
        ch.total > 0 ? Math.round((ch.completed / ch.total) * 100) : 0;
      const materialsScore = Math.min(100, mat.count * 33);
      const reflectionsScore = Math.min(100, ref.count * 100);
      const avgDepth =
        ref.depths.length > 0
          ? ref.depths.reduce((a, b) => a + b, 0) / ref.depths.length
          : null;

      const overallScore = Math.round(
        masteryScore * 0.4 +
          challengeScore * 0.3 +
          materialsScore * 0.2 +
          reflectionsScore * 0.1,
      );

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectSlug: subject.slug,
        masteryScore,
        challengeScore,
        materialsScore,
        reflectionsScore,
        overallScore,
        stats: {
          conceptsTracked: masteryScores.length,
          challengesCompleted: ch.completed,
          challengesTotal: ch.total,
          materialsRead: mat.count,
          readSeconds: mat.readSeconds,
          reflectionsSubmitted: ref.count,
          avgDepth,
        },
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  const overallMasteryScore =
    profiles.length > 0
      ? Math.round(
          (profiles.reduce((a, p) => a + p.masteryScore, 0) / profiles.length) *
            100,
        )
      : 0;

  const [allCompleted, allTotal, allMaterialReads, allReflections] =
    await Promise.all([
      prisma.challenge.count({
        where: {
          userId,
          status: "COMPLETED",
          scheduledFor: { gte: windowStart },
        },
      }),
      prisma.challenge.count({
        where: { userId, scheduledFor: { gte: windowStart } },
      }),
      prisma.materialRead.findMany({
        where: {
          userId,
          completed: true,
          readAt: { gte: windowStart },
        },
        select: { readSeconds: true },
      }),
      prisma.reflection.findMany({
        where: { userId, submittedAt: { gte: windowStart } },
        select: { id: true },
      }),
    ]);

  const overallChallengeScore =
    allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;
  const overallMaterialsScore = Math.min(100, allMaterialReads.length * 33);
  const overallReflectionsScore = Math.min(100, allReflections.length * 100);
  const overallScore = Math.round(
    overallMasteryScore * 0.4 +
      overallChallengeScore * 0.3 +
      overallMaterialsScore * 0.2 +
      overallReflectionsScore * 0.1,
  );

  return {
    userId,
    windowDays: safeWindow,
    windowStart: windowStart.toISOString(),
    windowEnd: now.toISOString(),
    overallScore,
    masteryScore: overallMasteryScore,
    challengeScore: overallChallengeScore,
    materialsScore: overallMaterialsScore,
    reflectionsScore: overallReflectionsScore,
    perSubject,
  };
}

export async function getStudentProgressSummary(
  userId: string,
): Promise<StudentProgressSummary> {
  await requireAccessToStudent(userId);

  const progress = await aggregateStudentProgress(userId, 7);
  const streakDays = await computeActivityStreak(userId);

  const timeline = await getProgressTimeline(userId, 14);
  const tail = timeline.points.slice(-7);
  const head = timeline.points.slice(0, 7);
  const avg = (xs: ProgressTimelinePoint[]) =>
    xs.length > 0 ? xs.reduce((a, p) => a + p.overallScore, 0) / xs.length : 0;
  const delta = avg(tail) - avg(head);
  let trend: "up" | "down" | "flat" = "flat";
  if (delta > 3) trend = "up";
  else if (delta < -3) trend = "down";

  const sortedByMastery = [...progress.perSubject].sort(
    (a, b) => b.masteryScore - a.masteryScore,
  );
  const sortedByMaterials = [...progress.perSubject].sort(
    (a, b) => b.stats.materialsRead - a.stats.materialsRead,
  );

  return {
    userId,
    generatedAt: new Date().toISOString(),
    windowDays: 7,
    overallScore: progress.overallScore,
    trend,
    streakDays,
    totalActiveSubjects: progress.perSubject.length,
    perSubject: progress.perSubject,
    highlights: {
      strongestSubject: sortedByMastery[0] ?? null,
      weakestSubject: sortedByMastery[sortedByMastery.length - 1] ?? null,
      mostReadSubject: sortedByMaterials[0] ?? null,
    },
  };
}

export async function getProgressTimeline(
  userId: string,
  days = 14,
): Promise<ProgressTimeline> {
  await requireAccessToStudent(userId);

  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  const dayMs = 86_400_000;
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate.getTime() - (safeDays - 1) * dayMs);

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId },
    select: { masteryScore: true },
  });
  const currentMasteryScore = Math.round(
    profiles.length > 0
      ? (profiles.reduce((a, p) => a + p.masteryScore, 0) / profiles.length) *
          100
      : 0,
  );

  const [allCompletedItems, allMaterialReads, allReflections] =
    await Promise.all([
      prisma.challengeItem.findMany({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate, lt: endDate },
          challenge: { userId },
        },
        select: { completedAt: true },
      }),
      prisma.materialRead.findMany({
        where: {
          userId,
          completed: true,
          readAt: { gte: startDate, lt: endDate },
        },
        select: { readAt: true },
      }),
      prisma.reflection.findMany({
        where: {
          userId,
          submittedAt: { gte: startDate, lt: endDate },
        },
        select: { submittedAt: true },
      }),
    ]);

  const dayBuckets = Array.from({ length: safeDays }, () => ({
    challengesCompleted: 0,
    materialsRead: 0,
    reflectionsSubmitted: 0,
  }));

  function dayIndex(time: Date): number {
    return Math.floor((time.getTime() - startDate.getTime()) / dayMs);
  }

  for (const item of allCompletedItems) {
    if (!item.completedAt) continue;
    const di = dayIndex(item.completedAt);
    if (di >= 0 && di < safeDays) dayBuckets[di].challengesCompleted++;
  }
  for (const read of allMaterialReads) {
    const di = dayIndex(read.readAt);
    if (di >= 0 && di < safeDays) dayBuckets[di].materialsRead++;
  }
  for (const ref of allReflections) {
    const di = dayIndex(ref.submittedAt);
    if (di >= 0 && di < safeDays) dayBuckets[di].reflectionsSubmitted++;
  }

  const points: ProgressTimelinePoint[] = [];
  for (let i = 0; i < safeDays; i++) {
    const dayDate = new Date(startDate.getTime() + i * dayMs)
      .toISOString()
      .split("T")[0];
    const { challengesCompleted, materialsRead, reflectionsSubmitted } =
      dayBuckets[i];

    const challengeScore = Math.min(
      100,
      Math.round((challengesCompleted / 4) * 100),
    );
    const materialsScore = Math.min(100, materialsRead * 33);
    const reflectionsScore = Math.min(100, reflectionsSubmitted * 100);

    const overallScore = Math.round(
      currentMasteryScore * 0.4 +
        challengeScore * 0.3 +
        materialsScore * 0.2 +
        reflectionsScore * 0.1,
    );

    points.push({
      date: dayDate,
      overallScore,
      masteryScore: currentMasteryScore,
      challengeScore,
      materialsScore,
      reflectionsScore,
      challengesCompleted,
      materialsRead,
      reflectionsSubmitted,
    });
  }

  return {
    userId,
    days: safeDays,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    points,
  };
}

async function computeActivityStreak(userId: string): Promise<number> {
  const items = await prisma.challengeItem.findMany({
    where: { status: "COMPLETED", challenge: { userId } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 5000,
  });

  const activeDays = new Set<string>();
  for (const item of items) {
    if (!item.completedAt) continue;
    const d = new Date(item.completedAt);
    d.setHours(0, 0, 0, 0);
    activeDays.add(d.toISOString().split("T")[0]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(today.getTime() - i * dayMs);
    const key = day.toISOString().split("T")[0];
    if (activeDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function getOrCreateWeeklyChallenge(): Promise<any> {
  const userId = await requireStudent();
  const monday = startOfWeek(new Date());

  let weekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });

  if (!weekly) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        grade: true,
        focusedSubjects: true,
        user: { select: { name: true } },
      },
    });

    const focusedSubjectIds = profile?.focusedSubjects ?? [];
    const focusedSubjectModels =
      focusedSubjectIds.length > 0
        ? await prisma.subject.findMany({
            where: { id: { in: focusedSubjectIds } },
            select: { name: true },
          })
        : [];
    const focusedSubjectNames = focusedSubjectModels.map((s) => s.name);

    const aiPlan = await generateWeeklyChallengeAI({
      userName: profile?.user.name ?? undefined,
      grade: profile?.grade,
      focusedSubjects: focusedSubjectNames,
    }).catch((err) => {
      console.error("AI weekly challenge generation failed:", err);
      return {
        title: "Misi Mingguan: Pemburu Ilmu",
        description: "Selesaikan 8 item tantangan belajar harian minggu ini untuk mengklaim reward 100 XP!",
        goal: 8,
      };
    });

    weekly = await prisma.weeklyChallenge.create({
      data: {
        userId,
        weekStart: monday,
        title: aiPlan.title,
        description: aiPlan.description,
        goal: aiPlan.goal,
        progress: 0,
        completed: false,
        xpRewarded: false,
      },
    });
  }

  const sunday = new Date(monday.getTime() + 7 * 86_400_000);
  const completedCount = await prisma.challengeItem.count({
    where: {
      challenge: {
        userId,
        scheduledFor: { gte: monday, lt: sunday },
      },
      status: "COMPLETED",
    },
  });

  if (completedCount !== weekly.progress) {
    weekly = await prisma.weeklyChallenge.update({
      where: { id: weekly.id },
      data: {
        progress: Math.min(completedCount, weekly.goal),
        completed: completedCount >= weekly.goal,
      },
    });
  }

  return {
    ...weekly,
    weekStart: weekly.weekStart.toISOString(),
    createdAt: weekly.createdAt.toISOString(),
  };
}

export async function updateWeeklyChallengeProgress(userId: string) {
  const monday = startOfWeek(new Date());
  const weekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });
  if (!weekly || weekly.xpRewarded) return;

  const sunday = new Date(monday.getTime() + 7 * 86_400_000);
  const completedCount = await prisma.challengeItem.count({
    where: {
      challenge: {
        userId,
        scheduledFor: { gte: monday, lt: sunday },
      },
      status: "COMPLETED",
    },
  });

  await prisma.weeklyChallenge.update({
    where: { id: weekly.id },
    data: {
      progress: Math.min(completedCount, weekly.goal),
      completed: completedCount >= weekly.goal,
    },
  });
}

export async function claimWeeklyChallengeReward(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const userId = await requireStudent();
  const monday = startOfWeek(new Date());

  const weekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });

  if (!weekly) return { ok: false, error: "Tantangan tidak ditemukan" };
  if (!weekly.completed) return { ok: false, error: "Tantangan belum selesai" };
  if (weekly.xpRewarded) return { ok: false, error: "Hadiah sudah diklaim" };

  await prisma.$transaction(async (tx) => {
    await tx.weeklyChallenge.update({
      where: { id: weekly.id },
      data: { xpRewarded: true },
    });
    await addXp(userId, 100, "WEEKLY_CHALLENGE", {
      weeklyChallengeId: weekly.id,
    });
  });

  revalidatePath("/challenge", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
