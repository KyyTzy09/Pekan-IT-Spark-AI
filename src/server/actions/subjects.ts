"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { XP_REWARDS } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { addXp } from "@/server/actions/gamification";
import {
  type CurriculumOutline,
  generateCurriculumOutline,
} from "@/server/ai/curriculum";
import {
  type AttemptRecord,
  computeMasteryUpdate,
  deriveConceptStatus,
} from "@/server/learning/adaptive";
import type {
  BloomTaxonomy,
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

  const subject = await prisma.$transaction(async (tx) => {
    const subjectRecord = await tx.subject.create({
      data: {
        slug: uniqueSlug as SubjectSlug,
        name: parsed.data.name,
        description: outline.description,
        icon: outline.icon,
        color: outline.color,
        order: 100,
        isCustom: true,
        source: "AI_GENERATED",
        createdById: userId,
        isVerified: false,
      },
    });

    for (let tIdx = 0; tIdx < outline.topics.length; tIdx++) {
      const t = outline.topics[tIdx];
      const topicSlug = slugify(t.name);
      const topicRecord = await tx.topic.create({
        data: {
          subjectId: subjectRecord.id,
          name: t.name,
          description: t.description,
          slug: topicSlug,
          order: tIdx,
          isCustom: true,
        },
      });

      for (let cIdx = 0; cIdx < t.concepts.length; cIdx++) {
        const c = t.concepts[cIdx];
        const conceptSlug = slugify(c.name);
        await tx.concept.create({
          data: {
            topicId: topicRecord.id,
            name: c.name,
            description: c.description,
            slug: conceptSlug,
            order: cIdx,
            isCustom: true,
          },
        });
      }
    }

    for (let qIdx = 0; qIdx < outline.pretestQuestions.length; qIdx++) {
      const q = outline.pretestQuestions[qIdx];
      const topicRecord = await tx.topic.findFirst({
        where: {
          subjectId: subjectRecord.id,
          order: q.topicIndex,
        },
        select: { id: true, concepts: { take: 1, select: { id: true } } },
      });
      if (!topicRecord?.concepts[0]) continue;
      await tx.question.create({
        data: {
          conceptId: topicRecord.concepts[0].id,
          type: "MULTIPLE_CHOICE" as QuestionType,
          difficulty: q.difficulty as Difficulty,
          bloomTaxonomy: "UNDERSTAND" as BloomTaxonomy,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: null,
          commonMisconceptions: null,
          tags: ["pretest", "ai-generated"],
          isActive: true,
        },
      });
    }

    return subjectRecord;
  });

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
): Promise<{ ok: boolean; error?: string; newMastery?: number }> {
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
    await addXp(
      userId,
      XP_REWARDS.CONCEPT_MASTERED,
      "CONCEPT_MASTERED",
      { conceptId: question.conceptId },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/subjects");

  return { ok: true, newMastery };
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
