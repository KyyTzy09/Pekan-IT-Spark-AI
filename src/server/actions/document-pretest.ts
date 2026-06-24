"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeDifficultyDistribution } from "@/server/ai/curriculum";
import { extractConceptsFromDocument } from "@/server/ai/extract-document-concepts";
import { generateQuestionsForConcept } from "@/server/ai/generate-questions";
import { incrementAiQuota, decrementAiQuota } from "@/server/ai-quota";

const submitPretestSchema = z.object({
  documentId: z.string().min(1),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      answer: z.string(),
      isCorrect: z.boolean(),
      conceptName: z.string(),
    }),
  ),
});

export async function generateDocumentPretest(documentId: string) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false as const, error: "Kamu harus login dulu." };
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true, content: true },
  });
  if (!doc || doc.userId !== session.id) {
    return { ok: false as const, error: "Dokumen tidak ditemukan." };
  }

  const concepts = await extractConceptsFromDocument(doc.content);
  if (concepts.length === 0) {
    return {
      ok: false as const,
      error: "Tidak bisa mengekstrak konsep dari dokumen.",
    };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    select: { learningStyle: true },
  });
  const learningStyle = profile?.learningStyle ?? "VISUAL";

  const questions: Array<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    conceptName: string;
  }> = [];

  for (const concept of concepts) {
    const quota = await incrementAiQuota(session.id, "questions", 1);
    if (!quota.allowed) break;

    const distribution = computeDifficultyDistribution(0, 3);
    try {
      const generated = await generateQuestionsForConcept({
        conceptName: concept.name,
        conceptDescription: concept.description,
        contentMd: doc.content.slice(0, 3000),
        learningStyle,
        easyCount: distribution.easy,
        mediumCount: distribution.medium,
        hardCount: distribution.hard,
      });

      for (const q of generated) {
        questions.push({ ...q, conceptName: concept.name });
      }
    } catch (err) {
      await decrementAiQuota(session.id, "questions", 1).catch(() => {});
      console.error(
        `Failed to generate pretest questions for concept: ${concept.name}`,
        err,
      );
    }
  }

  return { ok: true as const, questions };
}

export async function submitDocumentPretest(input: unknown) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false as const, error: "Kamu harus login dulu." };
  }

  const parsed = submitPretestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { documentId, answers } = parsed.data;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });
  if (!doc || doc.userId !== session.id) {
    return { ok: false as const, error: "Dokumen tidak ditemukan." };
  }

  const conceptAccuracy = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const bucket = conceptAccuracy.get(a.conceptName) ?? {
      correct: 0,
      total: 0,
    };
    bucket.total += 1;
    if (a.isCorrect) bucket.correct += 1;
    conceptAccuracy.set(a.conceptName, bucket);
  }

  let updatedCount = 0;
  for (const [conceptName, { correct, total }] of conceptAccuracy) {
    const ratio = total > 0 ? correct / total : 0;
    const masteryScore = Math.round(ratio * 100) / 100;

    const concept = await prisma.concept.findFirst({
      where: { name: { equals: conceptName, mode: "insensitive" } },
      select: { id: true },
    });
    if (!concept) continue;

    await prisma.studentKnowledgeProfile.upsert({
      where: {
        userId_conceptId: { userId: session.id, conceptId: concept.id },
      },
      update: {
        masteryScore,
        status:
          ratio >= 0.8 ? "MASTERED" : ratio > 0 ? "LEARNING" : "STRUGGLING",
        attemptCount: { increment: total },
        lastAttemptAt: new Date(),
      },
      create: {
        userId: session.id,
        conceptId: concept.id,
        masteryScore,
        status:
          ratio >= 0.8 ? "MASTERED" : ratio > 0 ? "LEARNING" : "STRUGGLING",
        attemptCount: total,
        lastAttemptAt: new Date(),
      },
    });
    updatedCount++;
  }

  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  return {
    ok: true as const,
    stats: {
      total: answers.length,
      correct: totalCorrect,
      conceptsUpdated: updatedCount,
    },
  };
}
