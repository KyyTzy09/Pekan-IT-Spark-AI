"use server";

import { randomUUID } from "node:crypto";
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
import type {
  BloomTaxonomy,
  ConceptStatus,
  Difficulty,
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
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Kamu harus login dulu." };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa yang bisa menambah mapel." };
  }

  const parsed = addCustomSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.user.id;
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { educationLevel: true, grade: true, focusedSubjects: true },
  });
  const educationLevel = profile?.educationLevel === "SMK" ? "SMK" : "SMA";

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
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Login dulu" };
  if (session.user.role !== "STUDENT") {
    return { ok: false, error: "Hanya siswa" };
  }

  const parsed = recordAttemptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid" };
  }

  const userId = session.user.id;
  const { questionId, answer, isCorrect, timeSpent } = parsed.data;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, conceptId: true, difficulty: true },
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

  const profile = await prisma.studentKnowledgeProfile.findUnique({
    where: {
      userId_conceptId: {
        userId,
        conceptId: question.conceptId,
      },
    },
  });
  const prevScore = profile?.masteryScore ?? 0;
  const attempt: AttemptRecord = {
    isCorrect,
    difficulty: question.difficulty,
    conceptId: question.conceptId,
    timeSpent: timeSpent ?? null,
    createdAt: new Date(),
  };
  const newMastery = computeMasteryUpdate(prevScore, attempt);
  const newStatus = deriveConceptStatus(newMastery);

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
      masteryScore: newMastery,
      status: newStatus,
      attemptCount: 1,
    },
    update: {
      masteryScore: newMastery,
      status: newStatus,
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  if (isCorrect) {
    await addXp(userId, XP_REWARDS.ANSWER_CORRECT, "ANSWER_CORRECT", {
      questionId,
      conceptId: question.conceptId,
      difficulty: question.difficulty,
    });
  }

  if (newStatus === "MASTERED" && prevScore < 0.8) {
    await addXp(userId, XP_REWARDS.CONCEPT_MASTERED, "CONCEPT_MASTERED", {
      conceptId: question.conceptId,
    });
  }

  const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);

  revalidatePath("/dashboard");
  revalidatePath("/subjects");

  return { ok: true, newMastery, unlockedBadges };
}

export async function selectNextQuestionDifficulty(
  conceptId: string,
  baseline: Difficulty = "EASY",
): Promise<Difficulty> {
  const session = await auth();
  if (!session?.user?.id) return baseline;
  const userId = session.user.id;
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
  const session = await auth();
  if (!session?.user?.id) return null;

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
        userId: session.user.id,
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
): Promise<{ ok: boolean; newStatus: ConceptStatus; earnedXp: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const userId = session.user.id;

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { id: true },
  });
  if (!concept) throw new Error("Concept not found");

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
