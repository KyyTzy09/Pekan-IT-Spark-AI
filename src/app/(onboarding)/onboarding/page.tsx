import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingWizardClient } from "@/components/onboarding/OnboardingWizardClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kenalan dulu — Spark Ai",
  description:
    "Isi profil kamu, pilih mapel fokus, atau bikin mapel kustom pakai AI.",
};

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

type PretestData = {
  pretestQuestions: PretestQuestion[];
  correctAnswers: Record<string, string>;
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/");

  const [subjects, pretest] = await Promise.all([
    prisma.subject.findMany({
      where: { isCustom: false },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    }),
    getPretestPool({
      perSubject: PRETEST_PER_SUBJECT,
      totalCap: PRETEST_MAX_TOTAL,
    }),
  ]);

  return (
    <OnboardingShell>
      <OnboardingWizardClient
        userName={session.user.name ?? "Teman"}
        subjects={subjects}
        pretestQuestions={pretest.pretestQuestions}
        correctAnswers={pretest.correctAnswers}
      />
    </OnboardingShell>
  );
}

async function getPretestPool(limits: {
  perSubject: number;
  totalCap: number;
}): Promise<PretestData> {
  const rows = await prisma.question.findMany({
    where: { isActive: true },
    select: {
      id: true,
      questionText: true,
      options: true,
      correctAnswer: true,
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
    take: limits.totalCap * 3,
  });

  const perSubjectCount = new Map<string, number>();
  const limited: PretestQuestion[] = [];
  const correctAnswers: Record<string, string> = {};

  for (const q of rows) {
    if (limited.length >= limits.totalCap) break;
    const subjectId = q.concept.topic.subjectId;
    const count = perSubjectCount.get(subjectId) ?? 0;
    if (count >= limits.perSubject) continue;
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
    correctAnswers[q.id] = q.correctAnswer;
  }

  return { pretestQuestions: limited, correctAnswers };
}
