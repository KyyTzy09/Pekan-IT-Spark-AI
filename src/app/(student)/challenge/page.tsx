import { redirect } from "next/navigation";
import {
  ChallengeListView,
  type SubjectOption,
} from "@/components/student/challenge";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getDailyProgress,
  getOrCreateWeeklyChallenge,
  getTodayChallenges,
} from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const userId = session.id;

  console.log("[CHALLENGE] 📄 Loading halaman challenge...");

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

  console.log("[CHALLENGE] ✅ Data loaded", {
    challengeHariIni: result.challenges.length,
    adaWeekly: !!weeklyChallenge,
    weeklySubjectCount: profile?.weeklyChallengeSubjectIds.length ?? 0,
  });

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
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
            color: true,
            isCustom: true,
          },
          orderBy: { order: "asc" },
        })
      : await prisma.subject.findMany({
          where: { isActive: true, isCustom: false },
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
            color: true,
            isCustom: true,
          },
          orderBy: { order: "asc" },
          take: 12,
        });

  const subjects = subjectRows;

  const allKnowledgeProfiles =
    allSubjectIds.length > 0
      ? await prisma.studentKnowledgeProfile.findMany({
          where: {
            userId,
            concept: { topic: { subjectId: { in: allSubjectIds } } },
          },
          select: {
            masteryScore: true,
            concept: { select: { topic: { select: { subjectId: true } } } },
          },
        })
      : [];

  const profilesBySubject = new Map<string, number[]>();
  for (const p of allKnowledgeProfiles) {
    const sid = p.concept.topic.subjectId;
    if (!profilesBySubject.has(sid)) profilesBySubject.set(sid, []);
    profilesBySubject.get(sid)?.push(p.masteryScore);
  }

  const subjectsWithMastery: SubjectOption[] = subjects.map((s) => {
    const scores = profilesBySubject.get(s.id) ?? [];
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;
    return {
      id: s.id,
      name: s.name,
      icon: s.icon,
      color: s.color,
      avgMastery: avg,
      isCustom: s.isCustom,
    };
  });

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
      hasSubjects={result.hasSubjects}
    />
  );
}
