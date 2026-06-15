import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/student/onboarding-shell";
import { OnboardingWizard } from "@/components/student/onboarding-wizard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kenalan dulu — Spark Ai",
  description:
    "Isi profil kamu, pilih mapel fokus, dan mulai ngobrol sama Spark.",
};

const PRETEST_LIMIT = 5;

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const [subjects, pretestQuestions, correctAnswers] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    }),
    getPretestQuestionsSafe(session.user.id, PRETEST_LIMIT),
    getCorrectAnswersSafe(session.user.id, PRETEST_LIMIT),
  ]);

  return (
    <OnboardingShell>
      <OnboardingWizard
        userName={session.user.name ?? "Teman"}
        subjects={subjects}
        pretestQuestions={pretestQuestions}
        correctAnswers={correctAnswers}
      />
    </OnboardingShell>
  );
}

async function getPretestQuestionsSafe(
  userId: string,
  perSubjectLimit: number,
): Promise<
  Array<{
    id: string;
    questionText: string;
    options: string[] | null;
    conceptId: string;
    conceptName: string;
    subjectName: string;
  }>
> {
  const focusedIds = await getFocusedSubjectIds(userId);
  if (focusedIds.length === 0) return [];

  const subjects = await prisma.subject.findMany({
    where: { id: { in: focusedIds } },
    select: { id: true, name: true },
  });
  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

  const allQuestions: Array<{
    id: string;
    questionText: string;
    options: string[] | null;
    conceptId: string;
    conceptName: string;
    subjectName: string;
  }> = [];
  for (const subjectId of focusedIds) {
    const questions = await prisma.question.findMany({
      where: {
        isActive: true,
        concept: { topic: { subjectId } },
      },
      include: {
        concept: { select: { id: true, name: true } },
      },
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      take: perSubjectLimit,
    });
    for (const q of questions) {
      allQuestions.push({
        id: q.id,
        questionText: q.questionText,
        options: q.options as string[] | null,
        conceptId: q.concept.id,
        conceptName: q.concept.name,
        subjectName: subjectNameMap.get(subjectId) ?? "Mata Pelajaran",
      });
    }
  }
  return allQuestions;
}

async function getCorrectAnswersSafe(
  userId: string,
  perSubjectLimit: number,
): Promise<Record<string, string>> {
  const focusedIds = await getFocusedSubjectIds(userId);
  if (focusedIds.length === 0) return {};

  const allIds: string[] = [];
  for (const subjectId of focusedIds) {
    const ids = await prisma.question.findMany({
      where: {
        isActive: true,
        concept: { topic: { subjectId } },
      },
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      take: perSubjectLimit,
      select: { id: true },
    });
    for (const q of ids) allIds.push(q.id);
  }
  if (allIds.length === 0) return {};

  const corrects = await prisma.question.findMany({
    where: { id: { in: allIds } },
    select: { id: true, correctAnswer: true },
  });
  return Object.fromEntries(corrects.map((q) => [q.id, q.correctAnswer]));
}

async function getFocusedSubjectIds(userId: string): Promise<string[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { focusedSubjects: true },
  });
  return profile?.focusedSubjects ?? [];
}
