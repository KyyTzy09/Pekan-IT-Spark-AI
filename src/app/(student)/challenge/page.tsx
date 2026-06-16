import { redirect } from "next/navigation";
import { ChallengeListView } from "@/components/student/challenge/challenge-list-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDailyProgress,
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
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Check if daily challenges for today already exist in database (fast count query)
  const existingCount = await prisma.challenge.count({
    where: {
      userId,
      scheduledFor: { gte: dayStart, lt: dayEnd },
    },
  });

  const [result, progress, focusedSubjectsRaw] = await Promise.all([
    existingCount > 0
      ? getTodayChallenges()
      : Promise.resolve({
          challenges: [],
          progress: { total: 0, completed: 0, points: 0 },
        }),
    existingCount > 0
      ? getDailyProgress()
      : Promise.resolve({
          date: dayStart.toISOString(),
          totalActive: 0,
          totalCompleted: 0,
          totalPoints: 0,
          overallScore: 0,
          masteryScore: 0,
          challengeScore: 0,
          materialsScore: 0,
          reflectionsScore: 0,
        }),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { focusedSubjects: true },
    }),
  ]);

  const subjects = await prisma.subject.findMany({
    where: focusedSubjectsRaw?.focusedSubjects.length
      ? { id: { in: focusedSubjectsRaw.focusedSubjects } }
      : undefined,
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });

  return (
    <ChallengeListView
      challenges={result.challenges}
      progress={result.progress}
      dailyProgress={progress}
      subjectOptions={subjects}
      initiallyEmpty={existingCount === 0}
    />
  );
}
