"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { XP_REWARDS } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import {
  addXp,
  checkAndUnlockBadges,
  recordActivity,
} from "@/server/actions/gamification";
import {
  type CurriculumOutline,
  generateCurriculumOutline,
  generateTopicConceptsContent,
} from "@/server/ai/curriculum";
import {
  type AttemptRecord,
  computeMasteryUpdate,
  deriveConceptStatus,
} from "@/server/learning/adaptive";
import {
  computeNewMastery,
  computeConfidence,
  daysBetween,
  estimateAvgTimeForDifficulty,
  getMasteryLabel,
  aggregateSubjectMastery,
} from "@/server/learning/mastery";
import {
  difficultyToScore,
} from "@/server/learning/difficulty";
import type {
  BloomTaxonomy,
  ConceptStatus,
  Difficulty,
  MaterialSource,
  QuestionType,
  SubjectSlug,
} from "../../../generated/prisma/client";

const addCustomSubjectSchema = z.object({
  name: z
    .string()
    .min(2, "Nama mapel minimal 2 karakter")
    .max(60, "Nama mapel maksimal 60 karakter")
    .trim(),
  context: z
    .string()
    .max(280, "Konteks maksimal 280 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type AddCustomSubjectInput = z.infer<typeof addCustomSubjectSchema>;

export type AddCustomSubjectResult =
  | { ok: true; subjectId: string; slug: string }
  | { ok: false; error: string };

export async function addCustomSubject(
  input: AddCustomSubjectInput,
): Promise<AddCustomSubjectResult> {
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Kamu harus login dulu." };
  if (session.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa yang bisa menambah mapel." };
  }

  const parsed = addCustomSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      educationLevel: true,
      grade: true,
      focusedSubjects: true,
      learningStyle: true,
      challengeSubjectIds: true,
    },
  });
  const educationLevel = profile?.educationLevel === "SMK" ? "SMK" : "SMA";
  const learningStyle = profile?.learningStyle ?? null;

  const existing = await prisma.subject.findFirst({
    where: {
      name: { equals: parsed.data.name, mode: "insensitive" },
      OR: [{ createdById: null }, { createdById: userId }],
    },
    select: { id: true, slug: true, isCustom: true, createdById: true },
  });
  if (existing) {
    if (existing.createdById === null) {
      return {
        ok: false,
        error: `"${parsed.data.name}" adalah mapel nasional. Pilih dari daftar.`,
      };
    }
    return { ok: true, subjectId: existing.id, slug: existing.slug };
  }

  let outline: CurriculumOutline;
  try {
    outline = await generateCurriculumOutline({
      subjectName: parsed.data.name,
      context: parsed.data.context || undefined,
      gradeLevel: profile?.grade ?? undefined,
      educationLevel,
    });
  } catch (e) {
    console.error("Curriculum generation failed:", e);
    return {
      ok: false,
      error:
        "Gagal membuat outline mapel. Coba lagi dengan nama yang lebih spesifik.",
    };
  }

  const baseSlug = slugify(parsed.data.name);
  const uniqueSlug = await generateUniqueSlug(baseSlug);

  // Generate detailed concept contents in parallel
  console.log("[addCustomSubject] Generating concepts details in parallel...");
  const contentPromises = outline.topics.map(async (t) => {
    try {
      const result = await generateTopicConceptsContent({
        topicName: t.name,
        topicDescription: t.description,
        concepts: t.concepts,
        learningStyle,
      });
      return { topicName: t.name, ok: true, data: result };
    } catch (err) {
      console.error(`Failed to generate details for topic: ${t.name}`, err);
      return { topicName: t.name, ok: false, data: null };
    }
  });

  const generatedContents = await Promise.all(contentPromises);

  // Map to hold concept details by concept name
  const conceptDetailsMap = new Map<
    string,
    { contentMd: string; questions: any[] }
  >();
  for (const item of generatedContents) {
    if (item.ok && item.data && Array.isArray(item.data.concepts)) {
      for (const c of item.data.concepts) {
        if (c?.conceptName) {
          conceptDetailsMap.set(c.conceptName.toLowerCase().trim(), {
            contentMd: c.contentMd,
            questions: Array.isArray(c.questions) ? c.questions : [],
          });
        }
      }
    }
  }

  const subjectId = randomUUID();
  const topicsData: any[] = [];
  const conceptsData: any[] = [];
  const questionsData: any[] = [];
  const materialsData: any[] = [];

  for (let tIdx = 0; tIdx < outline.topics.length; tIdx++) {
    const t = outline.topics[tIdx];
    const topicId = randomUUID();
    const topicSlug = `${slugify(t.name)}-${tIdx}`;

    topicsData.push({
      id: topicId,
      subjectId,
      name: t.name,
      description: t.description || null,
      slug: topicSlug,
      order: tIdx,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (let cIdx = 0; cIdx < t.concepts.length; cIdx++) {
      const c = t.concepts[cIdx];
      const details = conceptDetailsMap.get(c.name.toLowerCase().trim());
      const contentMd =
        details?.contentMd || `${c.description}. Selamat belajar!`;
      const conceptSlug = `${slugify(c.name)}-${cIdx}`;
      const conceptId = randomUUID();

      conceptsData.push({
        id: conceptId,
        topicId,
        name: c.name,
        description: c.description || null,
        slug: conceptSlug,
        order: cIdx,
        contentMd,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (details && details.questions.length > 0) {
        for (const q of details.questions) {
          questionsData.push({
            id: randomUUID(),
            conceptId,
            type: "MULTIPLE_CHOICE" as QuestionType,
            difficulty: q.difficulty as Difficulty,
            bloomTaxonomy: "UNDERSTAND" as BloomTaxonomy,
            questionText: q.questionText,
            options: q.options || null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            hint: q.hint || null,
            commonMisconceptions: null,
            tags: ["practice", "ai-generated"],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Create Material record for the materials library
      if (contentMd && contentMd.length > 50) {
        materialsData.push({
          id: randomUUID(),
          userId,
          subjectId,
          topicId,
          conceptId,
          title: c.name,
          content: contentMd,
          difficulty: "MEDIUM" as Difficulty,
          estimatedMinutes: Math.max(5, Math.floor(contentMd.length / 100)),
          source: "AI_GENERATED" as MaterialSource,
          createdAt: new Date(),
        });
      }
    }
  }

  for (let qIdx = 0; qIdx < outline.pretestQuestions.length; qIdx++) {
    const q = outline.pretestQuestions[qIdx];
    const matchingTopic = topicsData.find((t) => t.order === q.topicIndex);
    if (!matchingTopic) continue;

    const firstConcept = conceptsData.find(
      (c) => c.topicId === matchingTopic.id,
    );
    if (!firstConcept) continue;

    questionsData.push({
      id: randomUUID(),
      conceptId: firstConcept.id,
      type: "MULTIPLE_CHOICE" as QuestionType,
      difficulty: q.difficulty as Difficulty,
      bloomTaxonomy: "UNDERSTAND" as BloomTaxonomy,
      questionText: q.questionText,
      options: q.options || null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || null,
      hint: null,
      commonMisconceptions: null,
      tags: ["pretest", "ai-generated"],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const subject = await prisma.$transaction(
    async (tx) => {
      const subjectRecord = await tx.subject.create({
        data: {
          id: subjectId,
          slug: uniqueSlug as SubjectSlug,
          name: parsed.data.name,
          description: outline.description || null,
          icon: outline.icon || null,
          color: outline.color || null,
          order: 100,
          isCustom: true,
          source: "AI_GENERATED",
          createdById: userId,
          isVerified: false,
        },
      });

      if (topicsData.length > 0) {
        await tx.topic.createMany({
          data: topicsData,
        });
      }

      if (conceptsData.length > 0) {
        await tx.concept.createMany({
          data: conceptsData,
        });
      }

      if (questionsData.length > 0) {
        await tx.question.createMany({
          data: questionsData,
        });
      }

      if (materialsData.length > 0) {
        await tx.material.createMany({
          data: materialsData,
          skipDuplicates: true,
        });
      }

      return subjectRecord;
    },
    {
      timeout: 30000,
    },
  );

  // Generate RAG embeddings for all concepts of this custom subject
  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId: subject.id } },
    select: { id: true, name: true, description: true, contentMd: true },
  });

  if (concepts.length > 0) {
    try {
      const { embedMany, embeddingModel } = await import("@/lib/ai");
      const embedTexts = concepts.map(
        (c) =>
          `Konsep: ${c.name}. Deskripsi: ${c.description || ""}. Materi: ${c.contentMd || ""}`,
      );
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: embedTexts,
      });

      await prisma.conceptEmbedding.createMany({
        data: concepts.map((c, idx) => ({
          conceptId: c.id,
          embedding: JSON.stringify(embeddings[idx] || []),
        })),
        skipDuplicates: true,
      });
      console.log(
        `[addCustomSubject] Generated embeddings for ${concepts.length} concepts.`,
      );
    } catch (err) {
      console.error(
        "[addCustomSubject] Failed to generate concept embeddings for RAG:",
        err,
      );
    }
  }

  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  // Auto-favorite newly created custom subject so it appears in "Favorit kamu"
  // and becomes eligible for daily/weekly challenges.
  try {
    const currentFocused = Array.isArray(profile?.focusedSubjects)
      ? profile.focusedSubjects
      : [];
    const currentChallengeIds = Array.isArray(profile?.challengeSubjectIds)
      ? profile.challengeSubjectIds
      : [];

    const updateData: Record<string, any> = {};

    if (!currentFocused.includes(subject.id)) {
      updateData.focusedSubjects = { push: subject.id };
    }

    // Also add to challengeSubjectIds so it gets daily challenges
    if (!currentChallengeIds.includes(subject.id)) {
      updateData.challengeSubjectIds = { push: subject.id };
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.studentProfile.update({
        where: { userId },
        data: updateData,
      });
    }
  } catch (err) {
    console.error("[addCustomSubject] Failed to auto-favorite subject:", err);
  }

  return { ok: true, subjectId: subject.id, slug: subject.slug };
}

const recordAttemptSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1),
  isCorrect: z.boolean(),
  timeSpent: z.number().int().nonnegative().optional(),
});

export type RecordAttemptInput = z.infer<typeof recordAttemptSchema>;

export async function recordQuestionAttempt(
  input: RecordAttemptInput,
): Promise<{
  ok: boolean;
  error?: string;
  newMastery?: number;
  unlockedBadges?: any[];
}> {
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Login dulu" };
  if (session.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa" };
  }

  const parsed = recordAttemptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid" };
  }

  const userId = session.id;
  const { questionId, answer, isCorrect, timeSpent } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, conceptId: true, difficulty: true, difficultyScore: true },
  });
  if (!question) return { ok: false, error: "Soal tidak ditemukan" };

  await prisma.questionAttempt.create({
    data: {
      userId,
      questionId,
      answer,
      isCorrect,
      timeSpent: timeSpent ?? null,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // NEW MASTERY SYSTEM — Running Score (0-100)
  // ═══════════════════════════════════════════════════════════════

  // Get existing mastery from new table
  const existingMastery = await prisma.studentMastery.findUnique({
    where: {
      userId_conceptId: {
        userId,
        conceptId: question.conceptId,
      },
    },
  });

  const prevScore = existingMastery?.score ?? 0;
  const attemptCount = existingMastery?.attemptCount ?? 0;
  const lastAttemptAt = existingMastery?.lastAttemptAt;

  // Calculate days since last attempt
  const now = new Date();
  const daysSinceLastAttempt = lastAttemptAt
    ? daysBetween(lastAttemptAt, now)
    : 0;

  // Get difficulty score (use new field, fallback to conversion)
  const difficultyScore = question.difficultyScore ?? difficultyToScore(question.difficulty);

  // Calculate new mastery using new system
  const masteryResult = computeNewMastery({
    currentMastery: prevScore,
    attemptCount,
    isCorrect,
    difficultyScore,
    timeSpentSeconds: timeSpent ?? 0,
    avgTimeForDifficulty: estimateAvgTimeForDifficulty(difficultyScore),
    daysSinceLastAttempt,
  });

  // Calculate confidence
  const newConfidence = computeConfidence({
    attemptCount: attemptCount + 1,
    daysSinceLastAttempt: 0, // just attempted
  });

  // Update new mastery table
  await prisma.studentMastery.upsert({
    where: {
      userId_conceptId: {
        userId,
        conceptId: question.conceptId,
      },
    },
    create: {
      userId,
      conceptId: question.conceptId,
      score: masteryResult.newMastery,
      confidence: newConfidence,
      attemptCount: 1,
      correctCount: isCorrect ? 1 : 0,
      totalTimeSpent: timeSpent ?? 0,
      peakScore: masteryResult.newMastery,
      lastAttemptAt: now,
    },
    update: {
      score: masteryResult.newMastery,
      confidence: newConfidence,
      attemptCount: { increment: 1 },
      correctCount: isCorrect ? { increment: 1 } : undefined,
      totalTimeSpent: { increment: timeSpent ?? 0 },
      peakScore: { set: Math.max(existingMastery?.peakScore ?? 0, masteryResult.newMastery) },
      lastAttemptAt: now,
    },
  });

  // Update subject mastery (aggregation)
  await updateSubjectMastery(userId, question.conceptId);

  // ═══════════════════════════════════════════════════════════════
  // BACKWARD COMPATIBILITY — Update old table too
  // ═══════════════════════════════════════════════════════════════

  const oldStatus = deriveConceptStatus(masteryResult.newMastery / 100);

  await prisma.studentKnowledgeProfile.upsert({
    where: {
      userId_conceptId: {
        userId,
        conceptId: question.conceptId,
      },
    },
    create: {
      userId,
      conceptId: question.conceptId,
      masteryScore: masteryResult.newMastery / 100, // old scale 0-1
      status: oldStatus,
      attemptCount: 1,
    },
    update: {
      masteryScore: masteryResult.newMastery / 100, // old scale 0-1
      status: oldStatus,
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
    },
  });

  // XP rewards
  if (isCorrect) {
    await addXp(userId, XP_REWARDS.ANSWER_CORRECT, "ANSWER_CORRECT", {
      questionId,
      conceptId: question.conceptId,
      difficulty: question.difficulty,
    });
  }

  const masteryLabel = getMasteryLabel(masteryResult.newMastery);
  if (masteryLabel.label === "Menguasai" && prevScore < 89) {
    await addXp(userId, XP_REWARDS.CONCEPT_MASTERED, "CONCEPT_MASTERED", {
      conceptId: question.conceptId,
    });
  }

  const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);

  revalidatePath("/dashboard");
  revalidatePath("/subjects");

  return { ok: true, newMastery: masteryResult.newMastery, unlockedBadges };
}

/**
 * Update subject mastery aggregation after concept mastery changes.
 */
async function updateSubjectMastery(userId: string, conceptId: string): Promise<void> {
  // Find which subject this concept belongs to
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { topic: { select: { subjectId: true } } },
  });
  if (!concept) return;

  const subjectId = concept.topic.subjectId;

  // Get all concept IDs for this subject
  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId } },
    select: { id: true },
  });
  const conceptIds = concepts.map(c => c.id);

  // Get all concept masteries for this subject
  const conceptMasteries = await prisma.studentMastery.findMany({
    where: {
      userId,
      conceptId: { in: conceptIds },
    },
    select: {
      score: true,
      confidence: true,
      attemptCount: true,
      lastAttemptAt: true,
    },
  });

  // Aggregate
  const aggregated = aggregateSubjectMastery({ conceptMasteries });

  // Update subject mastery table
  await prisma.subjectMastery.upsert({
    where: {
      userId_subjectId: {
        userId,
        subjectId,
      },
    },
    create: {
      userId,
      subjectId,
      score: aggregated.score,
      confidence: aggregated.confidence,
      conceptsMastered: aggregated.conceptsMastered,
      conceptsTotal: aggregated.conceptsTotal,
      recommendedDifficulty: aggregated.recommendedDifficulty,
    },
    update: {
      score: aggregated.score,
      confidence: aggregated.confidence,
      conceptsMastered: aggregated.conceptsMastered,
      conceptsTotal: aggregated.conceptsTotal,
      recommendedDifficulty: aggregated.recommendedDifficulty,
    },
  });
}

export async function selectNextQuestionDifficulty(
  conceptId: string,
  baseline: Difficulty = "EASY",
): Promise<Difficulty> {
  const session = await getSession();
  if (!session?.id) return baseline;
  const userId = session.id;
  void userId;

  const attempts = await prisma.questionAttempt.findMany({
    where: { question: { conceptId } },
    orderBy: { createdAt: "asc" },
    select: {
      isCorrect: true,
      timeSpent: true,
      createdAt: true,
      question: { select: { difficulty: true, conceptId: true } },
    },
    take: 30,
  });

  const records: AttemptRecord[] = attempts.map((a) => ({
    isCorrect: a.isCorrect,
    difficulty: a.question.difficulty,
    timeSpent: a.timeSpent,
    conceptId: a.question.conceptId,
    createdAt: a.createdAt,
  }));

  const { selectNextDifficulty } = await import("@/server/learning/adaptive");
  return selectNextDifficulty(records, baseline);
}

export async function getConceptDetail(conceptId: string) {
  const session = await getSession();
  if (!session?.id) return null;

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      id: true,
      name: true,
      description: true,
      contentMd: true,
      topic: {
        select: {
          id: true,
          name: true,
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  if (!concept) return null;

  const profile = await prisma.studentKnowledgeProfile.findUnique({
    where: {
      userId_conceptId: {
        userId: session.id,
        conceptId,
      },
    },
    select: {
      masteryScore: true,
      status: true,
    },
  });

  return {
    ...concept,
    masteryScore: profile?.masteryScore ?? 0,
    status: profile?.status ?? "NOT_STARTED",
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function generateUniqueSlug(base: string): Promise<string> {
  const cleaned = base || "mapel";
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix =
      attempt === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${cleaned}${suffix}`;
    const exists = await prisma.subject.findUnique({
      where: { slug: candidate as SubjectSlug },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${cleaned}-${Date.now().toString(36).slice(-6)}`;
}

export async function markConceptAsRead(
  conceptId: string,
): Promise<
  | { ok: true; newStatus: ConceptStatus; earnedXp: number }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Login dulu ya" };
  const userId = session.id;

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { id: true },
  });
  if (!concept) return { ok: false, error: "Konsep tidak ditemukan" };

  const existingProfile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });

  const prevStatus: ConceptStatus = existingProfile?.status ?? "NOT_STARTED";

  if (prevStatus === "NOT_STARTED") {
    await prisma.studentKnowledgeProfile.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      create: {
        userId,
        conceptId,
        masteryScore: 0.1,
        status: "LEARNING",
      },
      update: {
        status: "LEARNING",
        masteryScore: 0.1,
      },
    });

    await addXp(userId, 5, "CHAT_SESSION", {
      conceptId,
      source: "CONCEPT_READ",
    }).catch(console.error);

    await recordActivity(userId).catch(console.error);

    revalidatePath("/dashboard");
    revalidatePath("/subjects");

    return { ok: true, newStatus: "LEARNING", earnedXp: 5 };
  }

  return { ok: true, newStatus: prevStatus, earnedXp: 0 };
}

const toggleSubjectFavoriteSchema = z.object({
  subjectId: z.string().min(1),
});

export type ToggleSubjectFavoriteResult =
  | { ok: true; focusedSubjects: string[]; isFavorite: boolean }
  | { ok: false; error: string };

export async function toggleSubjectFavorite(
  input: z.infer<typeof toggleSubjectFavoriteSchema>,
): Promise<ToggleSubjectFavoriteResult> {
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Kamu harus login dulu." };
  if (session.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa yang bisa mengatur favorit." };
  }

  const parsed = toggleSubjectFavoriteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const subjectId = parsed.data.subjectId;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });
  if (!subject) return { ok: false, error: "Mapel tidak ditemukan." };

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { focusedSubjects: true },
  });
  if (!profile) return { ok: false, error: "Profil siswa tidak ditemukan." };

  const current = Array.isArray(profile.focusedSubjects)
    ? profile.focusedSubjects
    : [];
  const isFavorite = current.includes(subjectId);

  let next: string[];
  if (isFavorite) {
    if (current.length <= 1) {
      return {
        ok: false,
        error: "Minimal harus ada 1 mapel favorit.",
      };
    }
    next = current.filter((id) => id !== subjectId);
  } else {
    next = [...current, subjectId];
  }

  await prisma.studentProfile.update({
    where: { userId },
    data: { focusedSubjects: next },
  });

  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/challenge");

  return { ok: true, focusedSubjects: next, isFavorite: !isFavorite };
}

/**
 * Generate materials, practice questions, and embeddings for an existing custom subject.
 * Only works for custom subjects that don't have contentMd yet.
 */
export async function generateMaterialsForSubject(
  subjectId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.id) return { ok: false, error: "Kamu harus login dulu." };
  if (session.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa yang bisa generate materi." };
  }

  const userId = session.id;

  // Fetch user profile for learning style
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { learningStyle: true },
  });

  // Verify subject exists and is custom
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      OR: [{ createdById: userId }, { isCustom: true }],
    },
    select: { id: true, name: true },
  });

  if (!subject) {
    return { ok: false, error: "Mapel tidak ditemukan." };
  }

  // Fetch topics and concepts
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    select: {
      id: true,
      name: true,
      description: true,
      concepts: {
        select: { id: true, name: true, description: true, contentMd: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  if (topics.length === 0) {
    return { ok: false, error: "Mapel belum memiliki topik." };
  }

  // Check if Material records already exist for this subject
  const existingMaterialCount = await prisma.material.count({
    where: { subjectId, userId },
  });

  if (existingMaterialCount > 0) {
    return {
      ok: false,
      error:
        "Materi sudah ada. Hapus materi lama dulu jika ingin generate ulang.",
    };
  }

  try {
    console.log("[SUBJECTS] Generating materials for subject", {
      subjectId,
      subjectName: subject.name,
    });

    // Generate content for all topics in parallel
    const contentPromises = topics.map(async (t) => {
      try {
        const result = await generateTopicConceptsContent({
          topicName: t.name,
          topicDescription: t.description || "",
          concepts: t.concepts.map((c) => ({
            name: c.name,
            description: c.description || "",
          })),
          learningStyle: profile?.learningStyle,
        });
        return { topicName: t.name, ok: true, data: result };
      } catch (err) {
        console.error(`Failed to generate content for topic: ${t.name}`, err);
        return { topicName: t.name, ok: false, data: null };
      }
    });

    const generatedContents = await Promise.all(contentPromises);

    // Build concept details map
    const conceptDetailsMap = new Map<
      string,
      {
        contentMd: string;
        questions: Array<{
          questionText: string;
          options: string[];
          correctAnswer: string;
          explanation: string;
          hint: string;
          difficulty: string;
        }>;
      }
    >();
    for (const item of generatedContents) {
      if (item.ok && item.data && Array.isArray(item.data.concepts)) {
        for (const c of item.data.concepts) {
          if (c?.conceptName) {
            conceptDetailsMap.set(c.conceptName.toLowerCase().trim(), {
              contentMd: c.contentMd,
              questions: Array.isArray(c.questions) ? c.questions : [],
            });
          }
        }
      }
    }

    // Update concepts with contentMd, create practice questions, AND create Material records
    const questionsData: Array<{
      id: string;
      conceptId: string;
      type: QuestionType;
      difficulty: Difficulty;
      bloomTaxonomy: BloomTaxonomy;
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string | null;
      hint: string | null;
      tags: string[];
      isActive: boolean;
    }> = [];
    const materialsData: Array<{
      id: string;
      userId: string;
      subjectId: string;
      topicId: string;
      conceptId: string;
      title: string;
      content: string;
      difficulty: Difficulty;
      estimatedMinutes: number;
      source: "AI_GENERATED";
    }> = [];

    for (const topic of topics) {
      for (const concept of topic.concepts) {
        const details = conceptDetailsMap.get(
          concept.name.toLowerCase().trim(),
        );
        if (!details) continue;

        // Update concept with contentMd
        await prisma.concept.update({
          where: { id: concept.id },
          data: { contentMd: details.contentMd },
        });

        // Create Material record for the materials library
        materialsData.push({
          id: randomUUID(),
          userId,
          subjectId,
          topicId: topic.id,
          conceptId: concept.id,
          title: concept.name,
          content: details.contentMd,
          difficulty: "MEDIUM" as Difficulty,
          estimatedMinutes: 5,
          source: "AI_GENERATED",
        });

        // Create practice questions
        for (const q of details.questions) {
          questionsData.push({
            id: randomUUID(),
            conceptId: concept.id,
            type: "MULTIPLE_CHOICE" as QuestionType,
            difficulty: (q.difficulty || "MEDIUM") as Difficulty,
            bloomTaxonomy: "UNDERSTAND" as BloomTaxonomy,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            hint: q.hint || null,
            tags: ["practice", "ai-generated"],
            isActive: true,
          });
        }
      }
    }

    // Bulk insert materials
    if (materialsData.length > 0) {
      await prisma.material.createMany({
        data: materialsData,
        skipDuplicates: true,
      });
      console.log(
        `[SUBJECTS] Created ${materialsData.length} material records`,
      );
    }

    // Bulk insert practice questions
    if (questionsData.length > 0) {
      await prisma.question.createMany({ data: questionsData });
      console.log(
        `[SUBJECTS] Created ${questionsData.length} practice questions`,
      );
    }

    // Generate RAG embeddings
    try {
      const { embedMany, embeddingModel } = await import("@/lib/ai");
      const updatedConcepts = await prisma.concept.findMany({
        where: { topic: { subjectId } },
        select: { id: true, name: true, description: true, contentMd: true },
      });

      if (updatedConcepts.length > 0) {
        const embedTexts = updatedConcepts.map(
          (c) =>
            `Konsep: ${c.name}. Deskripsi: ${c.description || ""}. Materi: ${c.contentMd || ""}`,
        );
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: embedTexts,
        });
        await prisma.conceptEmbedding.createMany({
          data: updatedConcepts.map((c, idx) => ({
            conceptId: c.id,
            embedding: JSON.stringify(embeddings[idx] || []),
          })),
          skipDuplicates: true,
        });
        console.log(
          `[SUBJECTS] Generated embeddings for ${updatedConcepts.length} concepts`,
        );
      }
    } catch (err) {
      console.error("[SUBJECTS] Failed to generate embeddings:", err);
    }

    revalidatePath(
      `/subjects/${subject.name.toLowerCase().replace(/\s+/g, "-")}`,
    );
    revalidatePath("/subjects");

    console.log("[SUBJECTS] Materials generation complete", { subjectId });
    return { ok: true };
  } catch (err) {
    console.error("[SUBJECTS] Materials generation failed:", err);
    return { ok: false, error: "Gagal generate materi. Coba lagi." };
  }
}
