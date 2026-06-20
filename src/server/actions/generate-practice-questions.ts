"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDifficultyDistribution } from "@/server/ai/curriculum";
import { generateQuestionsForConcept } from "@/server/ai/generate-questions";

const generateSchema = z.object({
  subjectId: z.string().min(1),
  totalCount: z.number().int().min(3).max(15),
});

export type GeneratePracticeQuestionsInput = z.infer<typeof generateSchema>;

export async function generatePracticeQuestionsForSubject(
  input: GeneratePracticeQuestionsInput,
): Promise<{
  ok: boolean;
  generated?: number;
  subjectName?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { subjectId, totalCount } = parsed.data;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true },
  });
  if (!subject) {
    return { ok: false, error: "Mapel tidak ditemukan." };
  }

  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId } },
    select: {
      id: true,
      name: true,
      description: true,
      contentMd: true,
      topic: { select: { name: true } },
    },
  });

  if (concepts.length === 0) {
    return { ok: false, error: "Belum ada konsep untuk mapel ini." };
  }

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: {
      userId: session.user.id,
      conceptId: { in: concepts.map((c) => c.id) },
    },
    select: { conceptId: true, masteryScore: true },
  });

  const masteryByConcept = new Map<string, number>();
  for (const p of profiles) {
    masteryByConcept.set(p.conceptId, p.masteryScore);
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { learningStyle: true },
  });
  const learningStyle = profile?.learningStyle ?? "VISUAL";

  let totalGenerated = 0;

  for (const concept of concepts) {
    const mastery = masteryByConcept.get(concept.id) ?? 0;
    const questionsPerConcept = Math.max(
      1,
      Math.ceil(totalCount / concepts.length),
    );
    const distribution = computeDifficultyDistribution(
      mastery,
      questionsPerConcept,
    );

    try {
      const questions = await generateQuestionsForConcept({
        conceptName: concept.name,
        conceptDescription: concept.description || concept.topic.name,
        contentMd: concept.contentMd || "",
        learningStyle,
        easyCount: distribution.easy,
        mediumCount: distribution.medium,
        hardCount: distribution.hard,
      });

      if (questions.length > 0) {
        await prisma.question.createMany({
          data: questions.map((q) => ({
            conceptId: concept.id,
            type: "MULTIPLE_CHOICE" as const,
            difficulty: q.difficulty,
            bloomTaxonomy: "UNDERSTAND" as const,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            hint: null,
            commonMisconceptions: null,
            tags: ["practice", "ai-generated", "on-demand"],
            isActive: true,
          })),
        });
        totalGenerated += questions.length;
      }
    } catch (err) {
      console.error(
        `Failed to generate questions for concept ${concept.name}:`,
        err,
      );
    }
  }

  return { ok: true, generated: totalGenerated, subjectName: subject.name };
}
