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

  const [result, progress, focusedSubjectsRaw] = await Promise.all([
    getTodayChallenges(),
    getDailyProgress(),
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { focusedSubjects: true },
    }),
  ]);

  const subjects = await prisma.subject.findMany({
    where: focusedSubjectsRaw?.focusedSubjects.length
      ? { slug: { in: focusedSubjectsRaw.focusedSubjects as never[] } }
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
    />
  );
}
