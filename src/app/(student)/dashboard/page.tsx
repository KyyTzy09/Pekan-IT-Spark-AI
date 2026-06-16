import { redirect } from "next/navigation";
import { DashboardWithChallengesView } from "@/components/student/dashboard-with-challenges-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayChallenges } from "@/server/actions/challenges";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
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

  const [summary, todayChallenges] = await Promise.all([
    getDashboardSummary(userId),
    existingCount > 0
      ? getTodayChallenges().then((r) => r.challenges)
      : Promise.resolve([]),
  ]);

  return (
    <DashboardWithChallengesView
      summary={summary}
      todayChallenges={todayChallenges}
    />
  );
}
