"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTopicConceptsContent } from "@/server/ai/curriculum";
import type {
  BloomTaxonomy,
  Difficulty,
  QuestionType,
} from "../../../generated/prisma/client";

const conceptSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const topicSchema = z.object({
  name: z.string(),
  description: z.string(),
  concepts: z.array(conceptSchema),
});

const pretestAnswerSchema = z.object({
  questionIndex: z.number().int().min(0),
  answer: z.string().max(8),
  isCorrect: z.boolean(),
  questionText: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const profileSchema = z.object({
  educationLevel: z.enum(["SMA", "SMK"]),
  grade: z.number().int().min(10).max(12),
  school: z.string().min(2).max(80),
  learningStyle: z.enum(["VISUAL", "TEXTUAL", "EXAMPLE_HEAVY", "SOCRATIC"]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  focusedSubjects: z.array(z.string()).default([]),
});

const completeSchema = z.object({
  profile: profileSchema,
  subjectName: z.string().min(2).max(60),
  subjectData: z.object({
    icon: z.string(),
    color: z.string(),
    description: z.string(),
    topics: z.array(topicSchema),
  }),
  pretestAnswers: z.array(pretestAnswerSchema),
});

export type CompleteOnboardingCustomInput = z.infer<typeof completeSchema>;

export type CompleteOnboardingCustomResult = {
  ok: boolean;
  message?: string;
};

export async function completeOnboardingCustom(
  input: unknown,
): Promise<CompleteOnboardingCustomResult> {
  console.log("[ONBOARDING_SERVICE] completeOnboardingCustom start", {
    input,
  });

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const userId = session.user.id;

  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data belum lengkap.",
    };
  }

  const data = parsed.data;
  let subjectId: string | null = null;

  try {

    await prisma.$transaction(async (tx) => {
      const existingSubject = await tx.subject.findFirst({
        where: {
          name: { equals: data.subjectName, mode: "insensitive" },
          OR: [{ createdById: null }, { createdById: userId }],
        },
        select: { id: true },
      });

      if (existingSubject) {
        subjectId = existingSubject.id;
      } else {
        const slug = `${data.subjectName.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}`;

        const subject = await tx.subject.create({
          data: {
            name: data.subjectName,
            slug,
            icon: data.subjectData.icon || "📚",
            color: data.subjectData.color || "#e11d48",
            description: data.subjectData.description || "",
            isCustom: true,
            createdById: userId,
            order: 999,
          },
          select: { id: true },
        });
        subjectId = subject.id;

        const topicsData: Array<{
          id: string;
          name: string;
          description: string;
          slug: string;
          subjectId: string;
          order: number;
        }> = [];
        const conceptsData: Array<{
          id: string;
          name: string;
          description: string;
          slug: string;
          topicId: string;
          order: number;
        }> = [];
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
          tags: string[];
          isActive: boolean;
        }> = [];

        for (let ti = 0; ti < data.subjectData.topics.length; ti++) {
          const t = data.subjectData.topics[ti];
          const topicId = randomUUID();

          topicsData.push({
            id: topicId,
            name: t.name,
            description: t.description,
            slug: t.name.toLowerCase().replace(/\s+/g, "-"),
            subjectId,
            order: ti + 1,
          });

          for (let ci = 0; ci < t.concepts.length; ci++) {
            const c = t.concepts[ci];
            const conceptId = randomUUID();

            conceptsData.push({
              id: conceptId,
              name: c.name,
              description: c.description,
              slug: c.name.toLowerCase().replace(/\s+/g, "-"),
              topicId,
              order: ci + 1,
            });
          }
        }

        await tx.topic.createMany({ data: topicsData });
        await tx.concept.createMany({ data: conceptsData });

        const topicIdByIndex = new Map<number, string>();
        for (let i = 0; i < topicsData.length; i++) {
          topicIdByIndex.set(i, topicsData[i].id);
        }

        for (const pa of data.pretestAnswers) {
          const topicId = topicIdByIndex.get(pa.questionIndex);
          if (!topicId) continue;

          const firstConcept = conceptsData.find(
            (c) => c.topicId === topicId,
          );
          if (!firstConcept) continue;

          questionsData.push({
            id: randomUUID(),
            conceptId: firstConcept.id,
            type: "MULTIPLE_CHOICE" as QuestionType,
            difficulty: pa.difficulty as Difficulty,
            bloomTaxonomy: "UNDERSTAND" as BloomTaxonomy,
            questionText: pa.questionText,
            options: pa.options,
            correctAnswer: pa.correctAnswer,
            explanation: pa.explanation || null,
            tags: ["pretest", "ai-generated"],
            isActive: true,
          });
        }

        if (questionsData.length > 0) {
          await tx.question.createMany({ data: questionsData });
        }
      }

      const reminderTime =
        data.profile.reminderEnabled && data.profile.reminderTime
          ? data.profile.reminderTime
          : null;

      const focusedSubjects = [
        ...data.profile.focusedSubjects,
        subjectId,
      ];

      await tx.studentProfile.upsert({
        where: { userId },
        update: {
          educationLevel: data.profile.educationLevel,
          grade: data.profile.grade,
          school: data.profile.school,
          focusedSubjects,
          learningStyle: data.profile.learningStyle,
          reminderEnabled: data.profile.reminderEnabled,
          reminderTime,
        },
        create: {
          userId,
          educationLevel: data.profile.educationLevel,
          grade: data.profile.grade,
          school: data.profile.school,
          focusedSubjects,
          learningStyle: data.profile.learningStyle,
          reminderEnabled: data.profile.reminderEnabled,
          reminderTime,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isOnboarded: true },
      });
    });

    console.log("[ONBOARDING_SERVICE] completeOnboardingCustom success", {
      userId,
      subjectName: data.subjectName,
    });

    // Generate materials, practice questions, and embeddings AFTER transaction
    if (subjectId) {
      await generateMaterialsForSubject(subjectId, data.subjectData.topics, userId, data.profile.learningStyle);
    }

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[ONBOARDING_SERVICE] completeOnboardingCustom error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      message: "Gagal menyimpan data. Coba lagi, ya.",
    };
  }
}

/**
 * Generate materials, practice questions, and embeddings for a custom subject.
 * Called after the transaction completes to avoid blocking onboarding.
 */
async function generateMaterialsForSubject(
  subjectId: string,
  topics: Array<{ name: string; description: string; concepts: Array<{ name: string; description: string }> }>,
  userId: string,
  learningStyle?: string | null,
) {
  try {
    console.log("[ONBOARDING_SERVICE] Generating materials for subject", { subjectId, learningStyle });

    // Generate content for all topics in parallel
    const contentPromises = topics.map(async (t) => {
      try {
        const result = await generateTopicConceptsContent({
          topicName: t.name,
          topicDescription: t.description,
          concepts: t.concepts,
          learningStyle: learningStyle as "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null | undefined,
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
      { contentMd: string; questions: Array<{ questionText: string; options: string[]; correctAnswer: string; explanation: string; hint: string; difficulty: string }> }
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

    // Fetch all concepts for this subject
    const concepts = await prisma.concept.findMany({
      where: { topic: { subjectId } },
      select: { id: true, name: true, topicId: true },
    });

    // Update concepts with contentMd and create practice questions
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

    for (const concept of concepts) {
      const details = conceptDetailsMap.get(concept.name.toLowerCase().trim());
      if (!details) continue;

      // Update concept with contentMd
      await prisma.concept.update({
        where: { id: concept.id },
        data: { contentMd: details.contentMd },
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

    // Bulk insert practice questions
    if (questionsData.length > 0) {
      await prisma.question.createMany({ data: questionsData });
      console.log(`[ONBOARDING_SERVICE] Created ${questionsData.length} practice questions`);
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
          (c) => `Konsep: ${c.name}. Deskripsi: ${c.description || ""}. Materi: ${c.contentMd || ""}`,
        );
        const { embeddings } = await embedMany({ model: embeddingModel, values: embedTexts });
        await prisma.conceptEmbedding.createMany({
          data: updatedConcepts.map((c, idx) => ({
            conceptId: c.id,
            embedding: JSON.stringify(embeddings[idx] || []),
          })),
          skipDuplicates: true,
        });
        console.log(`[ONBOARDING_SERVICE] Generated embeddings for ${updatedConcepts.length} concepts`);
      }
    } catch (err) {
      console.error("[ONBOARDING_SERVICE] Failed to generate embeddings:", err);
    }

    console.log("[ONBOARDING_SERVICE] Materials generation complete", { subjectId });
  } catch (err) {
    console.error("[ONBOARDING_SERVICE] Materials generation failed:", err);
  }
}
