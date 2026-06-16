"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  recordQuestionAttempt,
  selectNextQuestionDifficulty,
} from "@/server/actions/subjects";
import { summarizeSession } from "@/server/learning/adaptive";
import type {
  ConceptStatus,
  Difficulty,
} from "../../../generated/prisma/client";

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "STUDENT") throw new Error("FORBIDDEN");
  return session.user.id;
}

export type PracticeQuestion = {
  id: string;
  conceptId: string;
  conceptName: string;
  topicName: string;
  subjectName: string;
  subjectSlug: string;
  questionText: string;
  options: string[];
  difficulty: Difficulty;
};

export type PracticeSession = {
  question: PracticeQuestion;
  currentDifficulty: Difficulty;
  accuracyPct: number;
  recentTotal: number;
  weakPrereqs: Array<{ conceptId: string; name: string; score: number }>;
};

const RECENT_WINDOW = 20;

export async function getNextPracticeQuestion(
  subjectSlug?: string,
): Promise<
  { ok: true; session: PracticeSession } | { ok: false; error: string }
> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch (e) {
    return { ok: false, error: "Login dulu ya" };
  }

  const subjects = await prisma.subject.findMany({
    where: subjectSlug ? { slug: subjectSlug as never } : {},
    select: { id: true, slug: true, name: true },
  });
  if (subjects.length === 0) {
    return {
      ok: false,
      error: subjectSlug
        ? `Mapel ${subjectSlug} tidak ditemukan`
        : "Belum ada mapel",
    };
  }
  const subjectIds = subjects.map((s) => s.id);

  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId: { in: subjectIds } } },
    select: {
      id: true,
      name: true,
      topic: {
        select: {
          name: true,
          subject: { select: { id: true, name: true, slug: true } },
        },
      },
      prerequisites: {
        select: {
          prerequisiteId: true,
          minMasteryScore: true,
          prerequisite: { select: { name: true } },
        },
      },
    },
  });
  if (concepts.length === 0) {
    return { ok: false, error: "Belum ada konsep yang bisa dilatih" };
  }

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId, conceptId: { in: concepts.map((c) => c.id) } },
    select: { conceptId: true, masteryScore: true, status: true },
  });
  const masteryByConcept = new Map<
    string,
    { score: number; status: ConceptStatus }
  >();
  for (const p of profiles) {
    masteryByConcept.set(p.conceptId, {
      score: p.masteryScore,
      status: p.status,
    });
  }

  const recentlyAttempted = await prisma.questionAttempt.findMany({
    where: {
      userId,
      question: { concept: { id: { in: concepts.map((c) => c.id) } } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      isCorrect: true,
      question: {
        select: {
          difficulty: true,
          conceptId: true,
          concept: {
            select: {
              topic: {
                select: { subject: { select: { slug: true } } },
              },
            },
          },
        },
      },
      createdAt: true,
    },
  });
  const seenQuestionByConcept = new Map<string, Set<string>>();
  for (const a of recentlyAttempted) {
    const set =
      seenQuestionByConcept.get(a.question.conceptId) ?? new Set<string>();
    seenQuestionByConcept.set(a.question.conceptId, set);
  }
  const subjectFilteredAttempts = subjectSlug
    ? recentlyAttempted.filter(
        (a) => a.question.concept.topic.subject.slug === subjectSlug,
      )
    : recentlyAttempted;

  const recentRecords = subjectFilteredAttempts
    .slice(0, RECENT_WINDOW)
    .reverse();
  const total = recentRecords.length;
  const correctCount = recentRecords.filter((a) => a.isCorrect).length;
  const accuracyPct =
    total === 0 ? 0 : Math.round((correctCount / total) * 100);

  const lastConceptId = subjectFilteredAttempts[0]?.question.conceptId;
  const baseline: Difficulty = lastConceptId
    ? (recentlyAttempted.find((a) => a.question.conceptId === lastConceptId)
        ?.question.difficulty ?? "EASY")
    : "EASY";

  let chosenDifficulty: Difficulty = "EASY";
  if (lastConceptId) {
    try {
      chosenDifficulty = await selectNextQuestionDifficulty(
        lastConceptId,
        baseline,
      );
    } catch {
      chosenDifficulty = baseline;
    }
  }

  const eligibleConcepts: typeof concepts = [];
  const blockedConcepts: typeof concepts = [];
  const weakPrereqs: PracticeSession["weakPrereqs"] = [];
  const prereqRefCount = new Map<string, number>();
  for (const c of concepts) {
    const weakHere: PracticeSession["weakPrereqs"] = [];
    let prereqSatisfied = true;
    for (const edge of c.prerequisites) {
      const required = edge.minMasteryScore ?? 0.6;
      const m = masteryByConcept.get(edge.prerequisiteId);
      const score = m?.score ?? 0;
      if (score < required) {
        prereqSatisfied = false;
        weakHere.push({
          conceptId: edge.prerequisiteId,
          name: edge.prerequisite.name,
          score,
        });
        prereqRefCount.set(
          edge.prerequisiteId,
          (prereqRefCount.get(edge.prerequisiteId) ?? 0) + 1,
        );
      }
    }
    if (prereqSatisfied) {
      eligibleConcepts.push(c);
    } else {
      blockedConcepts.push(c);
      for (const w of weakHere) {
        if (
          weakPrereqs.length < 5 &&
          !weakPrereqs.some((existing) => existing.conceptId === w.conceptId)
        ) {
          weakPrereqs.push(w);
        }
      }
    }
  }

  if (eligibleConcepts.length === 0) {
    const nextPrereqConcepts = [...prereqRefCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => concepts.find((c) => c.id === id))
      .filter((c): c is (typeof concepts)[number] => Boolean(c))
      .filter((c) => c.prerequisites.length === 0);
    const fallbackConcept = nextPrereqConcepts[0] ?? null;
    if (!fallbackConcept) {
      return {
        ok: false,
        error:
          "Semua konsep masih terblokir prasyarat. Selesaikan prasyarat dulu ya.",
      };
    }
    eligibleConcepts.push(fallbackConcept);
  }

  const candidateConcept = pickConceptWeighted(
    eligibleConcepts,
    masteryByConcept,
  );
  if (!candidateConcept) {
    return { ok: false, error: "Tidak ada konsep yang bisa dilatih saat ini" };
  }

  const seenSet =
    seenQuestionByConcept.get(candidateConcept.id) ?? new Set<string>();
  const question = await prisma.question.findFirst({
    where: {
      conceptId: candidateConcept.id,
      isActive: true,
      difficulty: chosenDifficulty,
      id: seenSet.size > 0 ? { notIn: Array.from(seenSet) } : undefined,
    },
    orderBy: { createdAt: "asc" },
  });

  let selected = question;
  if (!selected) {
    selected = await prisma.question.findFirst({
      where: {
        conceptId: candidateConcept.id,
        isActive: true,
        id: seenSet.size > 0 ? { notIn: Array.from(seenSet) } : undefined,
      },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!selected) {
    selected = await prisma.question.findFirst({
      where: { conceptId: candidateConcept.id, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!selected) {
    return { ok: false, error: "Belum ada soal untuk konsep ini" };
  }

  const options = Array.isArray(selected.options)
    ? (selected.options as unknown as string[])
    : typeof selected.options === "string"
      ? (JSON.parse(selected.options) as string[])
      : [];

  return {
    ok: true,
    session: {
      question: {
        id: selected.id,
        conceptId: selected.conceptId,
        conceptName: candidateConcept.name,
        topicName: candidateConcept.topic.name,
        subjectName: candidateConcept.topic.subject.name,
        subjectSlug: candidateConcept.topic.subject.slug,
        questionText: selected.questionText,
        options,
        difficulty: selected.difficulty,
      },
      currentDifficulty: chosenDifficulty,
      accuracyPct,
      recentTotal: total,
      weakPrereqs: weakPrereqs.slice(0, 3),
    },
  };
}

function pickConceptWeighted<T extends { id: string }>(
  pool: T[],
  mastery: Map<string, { score: number; status: ConceptStatus }>,
): T | null {
  if (pool.length === 0) return null;
  const scored = pool.map((c) => {
    const m = mastery.get(c.id);
    const score = m?.score ?? 0;
    const weight = score < 0.4 ? 0.5 : score < 0.7 ? 0.3 : 0.15;
    return { c, weight };
  });
  const totalWeight = scored.reduce((s, x) => s + x.weight, 0);
  let pick = Math.random() * totalWeight;
  for (const x of scored) {
    pick -= x.weight;
    if (pick <= 0) return x.c;
  }
  return scored[scored.length - 1]?.c ?? null;
}

export type SubmitPracticeResult =
  | {
      ok: true;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string | null;
      newMastery: number;
      newStatus: ConceptStatus;
      masteredNow: boolean;
      unlockedConcepts: Array<{ id: string; name: string }>;
    }
  | { ok: false; error: string };

export async function submitPracticeAnswer(input: {
  questionId: string;
  answer: string;
  timeSpent?: number;
}): Promise<SubmitPracticeResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch (e) {
    return { ok: false, error: "Login dulu ya" };
  }

  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      conceptId: true,
      correctAnswer: true,
      explanation: true,
      concept: { select: { name: true } },
    },
  });
  if (!question) return { ok: false, error: "Soal tidak ditemukan" };

  const prevProfile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId, conceptId: question.conceptId } },
    select: { status: true, masteryScore: true },
  });
  const prevStatus: ConceptStatus = prevProfile?.status ?? "NOT_STARTED";

  const isCorrect =
    typeof question.correctAnswer === "string" &&
    question.correctAnswer.trim().toUpperCase() ===
      input.answer.trim().toUpperCase();

  const result = await recordQuestionAttempt({
    questionId: input.questionId,
    answer: input.answer,
    isCorrect,
    timeSpent: input.timeSpent,
  });
  if (!result.ok || result.newMastery === undefined) {
    return { ok: false, error: result.error ?? "Gagal menyimpan jawaban" };
  }

  const nextProfile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId, conceptId: question.conceptId } },
    select: { status: true },
  });
  const newStatus: ConceptStatus = nextProfile?.status ?? "NOT_STARTED";
  const masteredNow = prevStatus !== "MASTERED" && newStatus === "MASTERED";

  const unlockedConcepts: Array<{ id: string; name: string }> = [];
  if (masteredNow) {
    const dependents = await prisma.conceptPrerequisite.findMany({
      where: { prerequisiteId: question.conceptId },
      select: {
        conceptId: true,
        minMasteryScore: true,
        dependent: { select: { id: true, name: true } },
      },
    });
    for (const d of dependents) {
      const childProfile = await prisma.studentKnowledgeProfile.findUnique({
        where: { userId_conceptId: { userId, conceptId: d.conceptId } },
        select: { status: true },
      });
      if (!childProfile || childProfile.status === "NOT_STARTED") {
        unlockedConcepts.push({ id: d.dependent.id, name: d.dependent.name });
      }
    }
  }

  revalidatePath("/practice");
  revalidatePath("/dashboard");
  revalidatePath("/subjects");

  return {
    ok: true,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    newMastery: result.newMastery,
    newStatus,
    masteredNow,
    unlockedConcepts,
  };
}

export type PracticeStats = {
  accuracyPct: number;
  recentTotal: number;
  masteredCount: number;
  strugglingCount: number;
  currentDifficulty: Difficulty;
  recommendedDifficulty: Difficulty;
  longestStreak: number;
};

export async function getPracticeStats(): Promise<PracticeStats | null> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return null;
  }

  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      isCorrect: true,
      timeSpent: true,
      createdAt: true,
      question: { select: { difficulty: true, conceptId: true } },
    },
  });
  if (attempts.length === 0) {
    return {
      accuracyPct: 0,
      recentTotal: 0,
      masteredCount: 0,
      strugglingCount: 0,
      currentDifficulty: "EASY",
      recommendedDifficulty: "EASY",
      longestStreak: 0,
    };
  }

  const recent = attempts.slice(-RECENT_WINDOW);
  const correct = recent.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correct / recent.length) * 100);

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId },
    select: { conceptId: true, status: true, masteryScore: true },
  });
  const masteryByConcept = new Map(
    profiles.map((p) => [
      p.conceptId,
      {
        conceptId: p.conceptId,
        status: p.status,
        masteryScore: p.masteryScore,
      },
    ]),
  );
  const last = attempts[attempts.length - 1];
  const summary = summarizeSession(
    attempts.map((a) => ({
      isCorrect: a.isCorrect,
      difficulty: a.question.difficulty,
      conceptId: a.question.conceptId,
      timeSpent: a.timeSpent,
      createdAt: a.createdAt,
    })),
    last?.question.difficulty ?? "EASY",
    masteryByConcept,
  );

  return {
    accuracyPct: accuracy,
    recentTotal: recent.length,
    masteredCount: profiles.filter((p) => p.status === "MASTERED").length,
    strugglingCount: profiles.filter((p) => p.status === "STRUGGLING").length,
    currentDifficulty: summary.currentDifficulty,
    recommendedDifficulty: summary.recommendedDifficulty,
    longestStreak: summary.longestStreak,
  };
}
