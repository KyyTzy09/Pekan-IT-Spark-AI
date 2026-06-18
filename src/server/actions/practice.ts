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

function answersMatch(
  userAnswer: string,
  correctAnswer: string,
  options?: unknown,
): boolean {
  const normalized = userAnswer.trim().toUpperCase();
  const correct = correctAnswer.trim().toUpperCase();

  if (normalized === correct) return true;

  if (Array.isArray(options) && options.length > 0) {
    const letterIndex = normalized.charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < options.length) {
      const resolvedText = String(options[letterIndex]).trim().toUpperCase();
      if (resolvedText === correct) return true;
    }
  }

  return false;
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
  topicContext: { topicId: string; topicName: string } | null;
  socraticHint: string | null;
};

const SOCRATIC_HINTS: Record<string, string> = {
  EASY: "Coba inget lagi konsep utamanya. Apa yang pertama kali kamu pikirkan?",
  MEDIUM:
    "Coba pecah jadi langkah kecil. Kira-kira langkah pertama apa yang harus kamu lakukan?",
  HARD: "Ga apa-apa kalo belum ketemu. Yuk coba pake pertanyaan pemandu: apa yang kamu udah pastiin? apa yang masih bikin bingung?",
  ADVANCED:
    "Ini soal kompleks. Yuk kita pecah bareng — coba identifikasi dulu bagian mana yang kamu paling yakin.",
};

function socraticHintFor(difficulty: Difficulty): string {
  return SOCRATIC_HINTS[difficulty] ?? SOCRATIC_HINTS.MEDIUM!;
}

const RECENT_WINDOW = 20;

export async function getNextPracticeQuestion(
  options: { subjectSlug?: string; topicId?: string } = {},
): Promise<
  { ok: true; session: PracticeSession } | { ok: false; error: string }
> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch (e) {
    return { ok: false, error: "Login dulu ya" };
  }

  const subjectSlug = options.subjectSlug;
  const topicId = options.topicId;

  let topicContext: { topicId: string; topicName: string } | null = null;
  const [topic, subjects] = await Promise.all([
    topicId
      ? prisma.topic.findFirst({
          where: {
            id: topicId,
            subject: subjectSlug ? { slug: subjectSlug as never } : {},
          },
          select: { id: true, name: true, subjectId: true },
        })
      : null,
    prisma.subject.findMany({
      where: subjectSlug ? { slug: subjectSlug as never } : {},
      select: { id: true, slug: true, name: true },
    }),
  ]);
  if (topicId && !topic) {
    return { ok: false, error: "Topik tidak ditemukan" };
  }
  if (topic) {
    topicContext = { topicId: topic.id, topicName: topic.name };
  }
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
    where: {
      topic: topicId
        ? { id: topicId, subjectId: { in: subjectIds } }
        : { subjectId: { in: subjectIds } },
    },
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

  const [profiles, recentlyAttempted] = await Promise.all([
    prisma.studentKnowledgeProfile.findMany({
      where: { userId, conceptId: { in: concepts.map((c) => c.id) } },
      select: { conceptId: true, masteryScore: true, status: true },
    }),
    prisma.questionAttempt.findMany({
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
    }),
  ]);
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

  const questionOptions = Array.isArray(selected.options)
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
        options: questionOptions,
        difficulty: selected.difficulty,
      },
      currentDifficulty: chosenDifficulty,
      accuracyPct,
      recentTotal: total,
      weakPrereqs: weakPrereqs.slice(0, 3),
      topicContext,
      socraticHint: socraticHintFor(chosenDifficulty),
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
      hint: string | null;
      commonMisconceptions: string | null;
      newMastery: number;
      newStatus: ConceptStatus;
      masteredNow: boolean;
      unlockedConcepts: Array<{ id: string; name: string }>;
      stuck: {
        wrongStreak: number;
        recommendedPrereq: { id: string; name: string; score: number } | null;
      };
      unlockedBadges?: any[];
    }
  | { ok: false; error: string };

export async function getQuestionHint(input: {
  questionId: string;
}): Promise<
  | { ok: true; hint: string | null; explanation: string | null }
  | { ok: false; error: string }
> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const question = await prisma.question.findFirst({
    where: {
      id: input.questionId,
      concept: { topic: { subject: {} } },
    },
    select: { id: true, hint: true, explanation: true },
  });
  if (!question) return { ok: false, error: "Soal tidak ditemukan" };
  return { ok: true, hint: question.hint, explanation: question.explanation };
}

export type QuizQuestion = {
  id: string;
  conceptId: string;
  conceptName: string;
  topicName: string;
  questionText: string;
  options: string[];
  difficulty: Difficulty;
  hint: string | null;
};

export type QuizSession = {
  sessionId: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  totalQuestions: number;
  timeLimitSec: number;
  questions: QuizQuestion[];
  startedAt: string;
};

export type QuizAnswerResult =
  | {
      ok: true;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string | null;
      questionIndex: number;
    }
  | { ok: false; error: string };

export type QuizResult =
  | {
      ok: true;
      sessionId: string;
      totalQuestions: number;
      correctCount: number;
      scorePct: number;
      timeUsedSec: number;
      topicName: string;
      subjectName: string;
      breakdown: Array<{
        conceptId: string;
        conceptName: string;
        correct: number;
        wrong: number;
        total: number;
        status: "MASTERED" | "LEARNING" | "STRUGGLING" | "NOT_STARTED";
      }>;
    }
  | { ok: false; error: string };

const QUIZ_TTL_MS = 2 * 60 * 60 * 1000;
const QUIZ_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const QUIZ_BATCH_STORE = new Map<
  string,
  {
    userId: string;
    topicId: string;
    questionIds: string[];
    answers: Map<
      number,
      {
        questionId: string;
        answer: string;
        isCorrect: boolean;
        timeSpent: number;
      }
    >;
    startedAt: number;
    timeLimitSec: number;
  }
>();

function cleanupExpiredQuizzes() {
  const now = Date.now();
  for (const [id, session] of QUIZ_BATCH_STORE) {
    const elapsed = now - session.startedAt;
    const maxAge = Math.max(session.timeLimitSec * 1000 + 60_000, QUIZ_TTL_MS);
    if (elapsed > maxAge) {
      QUIZ_BATCH_STORE.delete(id);
    }
  }
}

const cleanupTimer = setInterval(
  cleanupExpiredQuizzes,
  QUIZ_CLEANUP_INTERVAL_MS,
);
cleanupTimer.unref?.();

function newQuizId(): string {
  return `qz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function startQuizSession(input: {
  topicId: string;
  numQuestions?: 5 | 8 | 10;
  timeLimitSec?: number;
}): Promise<{ ok: true; session: QuizSession } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const topic = await prisma.topic.findFirst({
    where: { id: input.topicId },
    select: {
      id: true,
      name: true,
      subject: { select: { name: true } },
    },
  });
  if (!topic) return { ok: false, error: "Topik tidak ditemukan" };

  const numQ = input.numQuestions ?? 5;
  const timeLimitSec = input.timeLimitSec ?? Math.max(120, numQ * 60);

  const allQuestions = await prisma.question.findMany({
    where: {
      isActive: true,
      concept: { topicId: input.topicId },
    },
    select: {
      id: true,
      difficulty: true,
      questionText: true,
      options: true,
      concept: {
        select: { id: true, name: true, topic: { select: { name: true } } },
      },
    },
  });
  if (allQuestions.length === 0) {
    return { ok: false, error: "Topik ini belum ada soal" };
  }
  // randomize order
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(numQ, shuffled.length));

  const quizSessionId = newQuizId();
  QUIZ_BATCH_STORE.set(quizSessionId, {
    userId,
    topicId: input.topicId,
    questionIds: picked.map((q) => q.id),
    answers: new Map(),
    startedAt: Date.now(),
    timeLimitSec,
  });

  const questions: QuizQuestion[] = picked.map((q) => ({
    id: q.id,
    conceptId: q.concept.id,
    conceptName: q.concept.name,
    topicName: q.concept.topic.name,
    questionText: q.questionText,
    options: Array.isArray(q.options)
      ? (q.options as unknown as string[])
      : typeof q.options === "string"
        ? (JSON.parse(q.options) as string[])
        : [],
    difficulty: q.difficulty,
    hint: null,
  }));

  return {
    ok: true,
    session: {
      sessionId: quizSessionId,
      topicId: topic.id,
      topicName: topic.name,
      subjectName: topic.subject.name,
      totalQuestions: questions.length,
      timeLimitSec,
      questions,
      startedAt: new Date().toISOString(),
    },
  };
}

export async function startPretestSession(input: {
  subjectId: string;
}): Promise<{ ok: true; session: QuizSession } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }

  const subject = await prisma.subject.findUnique({
    where: { id: input.subjectId },
    include: {
      topics: {
        orderBy: { order: "asc" },
        take: 1,
        select: { id: true, name: true },
      },
    },
  });

  if (!subject) return { ok: false, error: "Mata pelajaran tidak ditemukan" };
  if (subject.topics.length === 0) {
    return { ok: false, error: "Mata pelajaran ini belum memiliki topik" };
  }

  const firstTopic = subject.topics[0];

  const pretestQuestions = await prisma.question.findMany({
    where: {
      isActive: true,
      tags: { has: "pretest" },
      concept: { topic: { subjectId: subject.id } },
    },
    select: {
      id: true,
      difficulty: true,
      questionText: true,
      options: true,
      concept: {
        select: {
          id: true,
          name: true,
          topic: { select: { name: true } },
        },
      },
    },
  });

  let picked = pretestQuestions;

  if (picked.length === 0) {
    const allQuestions = await prisma.question.findMany({
      where: {
        isActive: true,
        concept: { topic: { subjectId: subject.id } },
      },
      select: {
        id: true,
        difficulty: true,
        questionText: true,
        options: true,
        concept: {
          select: {
            id: true,
            name: true,
            topic: { select: { name: true } },
          },
        },
      },
    });
    if (allQuestions.length === 0) {
      return { ok: false, error: "Belum ada soal untuk mata pelajaran ini" };
    }
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    picked = shuffled.slice(0, Math.min(5, shuffled.length));
  }

  const numQ = picked.length;
  const timeLimitSec = Math.max(120, numQ * 60);

  const quizSessionId = newQuizId();
  QUIZ_BATCH_STORE.set(quizSessionId, {
    userId,
    topicId: firstTopic.id,
    questionIds: picked.map((q) => q.id),
    answers: new Map(),
    startedAt: Date.now(),
    timeLimitSec,
  });

  const questions: QuizQuestion[] = picked.map((q) => ({
    id: q.id,
    conceptId: q.concept.id,
    conceptName: q.concept.name,
    topicName: q.concept.topic.name,
    questionText: q.questionText,
    options: Array.isArray(q.options)
      ? (q.options as unknown as string[])
      : typeof q.options === "string"
        ? (JSON.parse(q.options) as string[])
        : [],
    difficulty: q.difficulty,
    hint: null,
  }));

  const session: QuizSession = {
    sessionId: quizSessionId,
    topicId: firstTopic.id,
    topicName: `Pretest: ${subject.name}`,
    subjectName: subject.name,
    totalQuestions: numQ,
    timeLimitSec,
    questions,
    startedAt: new Date().toISOString(),
  };

  return { ok: true, session };
}

export async function submitQuizAnswer(input: {
  sessionId: string;
  questionId: string;
  answer: string;
  timeSpentSec: number;
}): Promise<QuizAnswerResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const store = QUIZ_BATCH_STORE.get(input.sessionId);
  if (!store || store.userId !== userId) {
    return { ok: false, error: "Sesi quiz udah expired. Mulai ulang ya." };
  }
  if (!store.questionIds.includes(input.questionId)) {
    return { ok: false, error: "Soal ini ga ada di sesi quiz kamu." };
  }
  const elapsedSec = (Date.now() - store.startedAt) / 1000;
  if (elapsedSec > store.timeLimitSec + 30) {
    return { ok: false, error: "Waktu udah lewat. Sesi di-close." };
  }
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true, correctAnswer: true, explanation: true, options: true },
  });
  if (!question) return { ok: false, error: "Soal tidak ditemukan" };

  const isCorrect = answersMatch(
    input.answer,
    question.correctAnswer,
    question.options,
  );

  await recordQuestionAttempt({
    questionId: input.questionId,
    answer: input.answer,
    isCorrect,
    timeSpent: Math.round(input.timeSpentSec),
  });

  const questionIndex = store.questionIds.indexOf(input.questionId);
  store.answers.set(questionIndex, {
    questionId: input.questionId,
    answer: input.answer,
    isCorrect,
    timeSpent: input.timeSpentSec,
  });

  return {
    ok: true,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    questionIndex,
  };
}

export async function getQuizResult(input: {
  sessionId: string;
}): Promise<QuizResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return {
      ok: false,
      error: "Login dulu ya",
    } as unknown as QuizResult;
  }
  const store = QUIZ_BATCH_STORE.get(input.sessionId);
  if (!store || store.userId !== userId) {
    return {
      ok: false,
      error: "Sesi quiz udah expired.",
    } as unknown as QuizResult;
  }

  const timeUsedSec = (Date.now() - store.startedAt) / 1000;

  // Read the just-recorded attempts to get correct counts per concept
  const allAttempts = await prisma.questionAttempt.findMany({
    where: {
      userId,
      questionId: { in: store.questionIds },
      createdAt: { gte: new Date(store.startedAt - 5_000) },
    },
    select: {
      questionId: true,
      isCorrect: true,
      question: { select: { conceptId: true } },
    },
  });

  const topic = await prisma.topic.findUnique({
    where: { id: store.topicId },
    select: {
      name: true,
      subject: { select: { name: true } },
    },
  });

  const conceptMap = new Map<
    string,
    { id: string; name: string; correct: number; wrong: number; total: number }
  >();
  for (const a of allAttempts) {
    const conceptId = a.question.conceptId;
    const concept = await prisma.concept.findUnique({
      where: { id: conceptId },
      select: { name: true },
    });
    const entry = conceptMap.get(conceptId) ?? {
      id: conceptId,
      name: concept?.name ?? "?",
      correct: 0,
      wrong: 0,
      total: 0,
    };
    entry.total += 1;
    if (a.isCorrect) entry.correct += 1;
    else entry.wrong += 1;
    conceptMap.set(conceptId, entry);
  }

  // attach mastery status
  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: {
      userId,
      conceptId: { in: Array.from(conceptMap.keys()) },
    },
    select: { conceptId: true, status: true },
  });
  const statusMap = new Map(profiles.map((p) => [p.conceptId, p.status]));

  const breakdown = Array.from(conceptMap.values()).map((c) => ({
    conceptId: c.id,
    conceptName: c.name,
    correct: c.correct,
    wrong: c.wrong,
    total: c.total,
    status: statusMap.get(c.id) ?? ("NOT_STARTED" as const),
  }));

  const correctCount = breakdown.reduce((acc, c) => acc + c.correct, 0);
  const totalQ = breakdown.reduce((acc, c) => acc + c.total, 0);
  const scorePct = totalQ === 0 ? 0 : Math.round((correctCount / totalQ) * 100);

  // cleanup
  QUIZ_BATCH_STORE.delete(input.sessionId);

  return {
    ok: true,
    sessionId: input.sessionId,
    totalQuestions: store.questionIds.length,
    correctCount,
    scorePct,
    timeUsedSec: Math.round(timeUsedSec),
    topicName: topic?.name ?? "?",
    subjectName: topic?.subject.name ?? "?",
    breakdown,
  };
}

export async function abortQuizSession(input: {
  sessionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const store = QUIZ_BATCH_STORE.get(input.sessionId);
  if (!store || store.userId !== userId)
    return { ok: false, error: "Ga ada sesi" };
  QUIZ_BATCH_STORE.delete(input.sessionId);
  return { ok: true };
}

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
      hint: true,
      commonMisconceptions: true,
      options: true,
      concept: { select: { name: true } },
    },
  });
  if (!question) return { ok: false, error: "Soal tidak ditemukan" };

  const prevProfile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId, conceptId: question.conceptId } },
    select: { status: true, masteryScore: true },
  });
  const prevStatus: ConceptStatus = prevProfile?.status ?? "NOT_STARTED";

  const isCorrect = answersMatch(
    input.answer,
    question.correctAnswer,
    question.options,
  );

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

  // Stuck detection: cek 5 attempt terakhir di konsep ini. Kalo 2+
  // salah berturut-turut DAN ada prereq yang lemah, rekomendasi remedial.
  const recentAttempts = await prisma.questionAttempt.findMany({
    where: { userId, question: { conceptId: question.conceptId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { isCorrect: true, createdAt: true },
  });
  let wrongStreak = 0;
  for (const a of recentAttempts) {
    if (a.isCorrect) break;
    wrongStreak++;
  }

  let recommendedPrereq: {
    id: string;
    name: string;
    score: number;
  } | null = null;
  if (wrongStreak >= 2) {
    const prereqRows = await prisma.conceptPrerequisite.findMany({
      where: { conceptId: question.conceptId },
      select: { prerequisiteId: true },
    });
    const prereqIds = prereqRows.map((r) => r.prerequisiteId);
    if (prereqIds.length > 0) {
      const [prereqs, profiles] = await Promise.all([
        prisma.concept.findMany({
          where: { id: { in: prereqIds } },
          select: { id: true, name: true },
        }),
        prisma.studentKnowledgeProfile.findMany({
          where: { userId, conceptId: { in: prereqIds } },
          select: { conceptId: true, masteryScore: true },
        }),
      ]);
      const scoreMap = new Map(
        profiles.map((p) => [p.conceptId, p.masteryScore]),
      );
      const sorted = prereqs
        .map((p) => ({
          id: p.id,
          name: p.name,
          score: scoreMap.get(p.id) ?? 0,
        }))
        .sort((a, b) => a.score - b.score);
      recommendedPrereq = sorted[0] ?? null;
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
    hint: question.hint,
    commonMisconceptions: question.commonMisconceptions,
    newMastery: result.newMastery,
    newStatus,
    masteredNow,
    unlockedConcepts,
    stuck: { wrongStreak, recommendedPrereq },
    unlockedBadges: result.unlockedBadges,
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
