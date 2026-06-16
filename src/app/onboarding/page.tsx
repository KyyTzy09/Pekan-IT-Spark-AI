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

type SubjectOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type PretestQuestion = {
  id: string;
  questionText: string;
  options: string[] | null;
  conceptId: string;
  conceptName: string;
  subjectName: string;
};

type PretestData = {
  pretestQuestions: PretestQuestion[];
  correctAnswers: Record<string, string>;
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/");

  const [subjects, focusedIds] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    }),
    getFocusedSubjectIds(session.user.id),
  ]);

  const { pretestQuestions, correctAnswers } = await getPretestData(
    focusedIds,
    subjects,
    PRETEST_LIMIT,
  );

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

async function getPretestData(
  focusedIds: string[],
  subjects: SubjectOption[],
  perSubjectLimit: number,
): Promise<PretestData> {
  if (focusedIds.length === 0) {
    return { pretestQuestions: [], correctAnswers: {} };
  }

  const subjectNameMap = new Map(subjects.map((s) => [s.id, s.name]));

  const perSubject = await Promise.all(
    focusedIds.map((subjectId) =>
      prisma.question.findMany({
        where: {
          isActive: true,
          concept: { topic: { subjectId } },
        },
        select: {
          id: true,
          questionText: true,
          options: true,
          concept: { select: { id: true, name: true } },
        },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
        take: perSubjectLimit,
      }),
    ),
  );

  const pretestQuestions: PretestQuestion[] = [];
  const questionIds: string[] = [];
  perSubject.forEach((questions, i) => {
    const subjectId = focusedIds[i];
    if (!subjectId) return;
    const subjectName = subjectNameMap.get(subjectId) ?? "Mata Pelajaran";
    for (const q of questions) {
      pretestQuestions.push({
        id: q.id,
        questionText: q.questionText,
        options: q.options as string[] | null,
        conceptId: q.concept.id,
        conceptName: q.concept.name,
        subjectName,
      });
      questionIds.push(q.id);
    }
  });

  if (questionIds.length === 0) {
    return { pretestQuestions, correctAnswers: {} };
  }

  const corrects = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctAnswer: true },
  });
  const correctAnswers: Record<string, string> = {};
  for (const q of corrects) correctAnswers[q.id] = q.correctAnswer;

  return { pretestQuestions, correctAnswers };
}

async function getFocusedSubjectIds(userId: string): Promise<string[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { focusedSubjects: true },
  });
  return profile?.focusedSubjects ?? [];
}
