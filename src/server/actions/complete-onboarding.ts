"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";

const completeSchema = z.object({
  educationLevel: z.enum(["SMA", "SMK"]),
  grade: z.number().int().min(10).max(12),
  school: z.string().min(2).max(80),
  focusedSubjects: z.array(z.string()).min(1).max(4),
  learningStyle: z.enum(["VISUAL", "TEXTUAL", "EXAMPLE_HEAVY", "SOCRATIC"]),
  reminderEnabled: z.boolean(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  pretestAnswers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        conceptId: z.string().min(1),
        answer: z.string().max(8),
        isCorrect: z.boolean(),
      }),
    )
    .default([]),
});

export type CompleteOnboardingInput = z.infer<typeof completeSchema>;

async function requireStudent() {
  console.log("[ONBOARDING_SERVICE] requireStudent verification start");
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }
  return { userId: session.user.id };
}

export type CompleteOnboardingResult = {
  ok: boolean;
  message?: string;
  pretestStats?: { total: number; correct: number };
};

export async function completeOnboarding(
  input: unknown,
): Promise<CompleteOnboardingResult> {
  console.log("[ONBOARDING_SERVICE] completeOnboarding action start", {
    input,
  });
  const { userId } = await requireStudent();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data belum lengkap.",
    };
  }
  const data = parsed.data;

  const validSubjects = await prisma.subject.findMany({
    where: { id: { in: data.focusedSubjects } },
    select: { id: true },
  });
  if (validSubjects.length !== data.focusedSubjects.length) {
    return { ok: false, message: "Ada mata pelajaran yang nggak valid." };
  }

  const reminderTime =
    data.reminderEnabled && data.reminderTime ? data.reminderTime : null;

  const profileData = {
    educationLevel: data.educationLevel,
    grade: data.grade,
    school: data.school,
    focusedSubjects: data.focusedSubjects,
    learningStyle: data.learningStyle,
    reminderEnabled: data.reminderEnabled,
    reminderTime,
  };

  const knowledgeUpserts: Prisma.StudentKnowledgeProfileCreateManyInput[] = [];
  if (data.pretestAnswers.length > 0) {
    const correctByConcept = new Map<
      string,
      { correct: number; total: number }
    >();
    for (const a of data.pretestAnswers) {
      const bucket = correctByConcept.get(a.conceptId) ?? {
        correct: 0,
        total: 0,
      };
      bucket.total += 1;
      if (a.isCorrect) bucket.correct += 1;
      correctByConcept.set(a.conceptId, bucket);
    }

    for (const [conceptId, { correct, total }] of correctByConcept) {
      const ratio = total > 0 ? correct / total : 0;
      const masteryScore = Math.round(ratio * 100) / 100;
      knowledgeUpserts.push({
        userId,
        conceptId,
        masteryScore,
        status: ratio > 0 ? ("LEARNING" as const) : ("STRUGGLING" as const),
        attemptCount: total,
        lastAttemptAt: new Date(),
      });
    }
  }

  const attemptsData =
    data.pretestAnswers.length > 0
      ? data.pretestAnswers.map((a) => ({
          userId,
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
        }))
      : [];

  try {
    await prisma.$transaction(async (tx) => {
      const ops: Promise<unknown>[] = [
        tx.studentProfile.upsert({
          where: { userId },
          update: profileData,
          create: { userId, ...profileData },
        }),
        tx.user.update({
          where: { id: userId },
          data: { isOnboarded: true },
        }),
      ];

      if (knowledgeUpserts.length > 0) {
        for (const u of knowledgeUpserts) {
          ops.push(
            tx.studentKnowledgeProfile.upsert({
              where: { userId_conceptId: { userId, conceptId: u.conceptId } },
              create: u,
              update: {
                masteryScore: u.masteryScore,
                status: u.status,
                attemptCount: { increment: u.attemptCount },
                lastAttemptAt: u.lastAttemptAt,
              },
            }),
          );
        }
      }

      if (attemptsData.length > 0) {
        ops.push(
          tx.questionAttempt.createMany({
            data: attemptsData,
          }),
        );
      }

      await Promise.all(ops);
    });
  } catch (err) {
    console.error(
      "[ONBOARDING_SERVICE] completeOnboarding transaction failed",
      {
        userId,
        error: err instanceof Error ? err.message : String(err),
      },
    );
    return {
      ok: false,
      message: "Gagal menyimpan data onboarding. Coba lagi, ya.",
    };
  }

  return {
    ok: true,
    pretestStats:
      data.pretestAnswers.length > 0
        ? {
            total: data.pretestAnswers.length,
            correct: data.pretestAnswers.filter((a) => a.isCorrect).length,
          }
        : undefined,
  };
}
