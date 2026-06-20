import { redirect } from "next/navigation";
import { ChallengeListView, type SubjectOption } from "@/components/student/challenge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDailyProgress,
  getOrCreateWeeklyChallenge,
  getTodayChallenges,
} from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const [result, progress, profile, weeklyChallenge] = await Promise.all([
    getTodayChallenges(),
    getDailyProgress(),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        challengeSubjectIds: true,
        weeklyChallengeSubjectIds: true,
        focusedSubjects: true,
      },
    }),
    getOrCreateWeeklyChallenge(),
  ]);

  const allSubjectIds = Array.from(
    new Set([
      ...(profile?.focusedSubjects ?? []),
      ...(profile?.challengeSubjectIds ?? []),
      ...(profile?.weeklyChallengeSubjectIds ?? []),
    ]),
  );

  const subjectRows =
    allSubjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: allSubjectIds }, isActive: true },
          select: { id: true, slug: true, name: true },
          orderBy: { order: "asc" },
        })
      : await prisma.subject.findMany({
          where: { isActive: true, isCustom: false },
          select: { id: true, slug: true, name: true },
          orderBy: { order: "asc" },
          take: 12,
        });

  const subjects = subjectRows;
  const subjectsWithMastery: SubjectOption[] = await Promise.all(
    subjects.map(async (s) => {
      const profiles = await prisma.studentKnowledgeProfile.findMany({
        where: {
          userId,
          concept: { topic: { subjectId: s.id } },
        },
        select: { masteryScore: true },
      });
      const scores = profiles.map((p) => p.masteryScore);
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      const fullSubject = await prisma.subject.findUnique({
        where: { id: s.id },
        select: { icon: true, color: true, isCustom: true },
      });
      return {
        id: s.id,
        name: s.name,
        icon: fullSubject?.icon ?? null,
        color: fullSubject?.color ?? null,
        avgMastery: avg,
        isCustom: fullSubject?.isCustom ?? false,
      };
    }),
  );

  return (
    <ChallengeListView
      challenges={result.challenges}
      progress={result.progress}
      dailyProgress={progress}
      subjectOptions={subjects}
      initialChallengeSubjectIds={profile?.challengeSubjectIds ?? []}
      initialWeeklySubjectIds={profile?.weeklyChallengeSubjectIds ?? []}
      availableSubjects={subjectsWithMastery}
      initiallyEmpty={false}
      weeklyChallenge={weeklyChallenge}
    />
  );
}
