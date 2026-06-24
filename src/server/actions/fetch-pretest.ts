"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const PRETEST_PER_SUBJECT = 3;
const PRETEST_MAX_TOTAL = 30;

type PretestQuestion = {
  id: string;
  questionText: string;
  options: string[] | null;
  conceptId: string;
  conceptName: string;
  subjectId: string;
  subjectName: string;
};

export type FetchPretestResult =
  | {
      ok: true;
      questions: PretestQuestion[];
      correctAnswers: Record<string, string>;
    }
  | {
      ok: false;
      error: string;
    };

export async function fetchPretestPool(): Promise<FetchPretestResult> {
  // UX-9 FIX: Add authentication check
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "Login dulu ya" };
  }

  try {
    const rows = await prisma.question.findMany({
      where: { isActive: true },
      select: {
        id: true,
        questionText: true,
        options: true,
        // UX-9 FIX: Don't fetch correctAnswer — it leaks to the client
        concept: {
          select: {
            id: true,
            name: true,
            topic: {
              select: {
                subjectId: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      take: PRETEST_MAX_TOTAL * 3,
    });

    const perSubjectCount = new Map<string, number>();
    const limited: PretestQuestion[] = [];

    for (const q of rows) {
      if (limited.length >= PRETEST_MAX_TOTAL) break;
      const subjectId = q.concept.topic.subjectId;
      const count = perSubjectCount.get(subjectId) ?? 0;
      if (count >= PRETEST_PER_SUBJECT) continue;
      perSubjectCount.set(subjectId, count + 1);
      limited.push({
        id: q.id,
        questionText: q.questionText,
        options: q.options as string[] | null,
        conceptId: q.concept.id,
        conceptName: q.concept.name,
        subjectId,
        subjectName: q.concept.topic.subject.name,
      });
    }

    // UX-9 FIX: Don't return correctAnswers — answers are verified server-side only
    return { ok: true, questions: limited, correctAnswers: {} };
  } catch (err) {
    console.error("[fetchPretestPool] error:", err);
    return { ok: false, error: "Gagal memuat soal pretest." };
  }
}
