import { redirect } from "next/navigation";
import { DashboardWithChallengesView } from "@/components/student/dashboard-with-challenges-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getProgressTimeline,
  getTodayChallenges,
} from "@/server/actions/challenges";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role === "PARENT") {
    redirect("/parent");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  const [summary, todayChallenges, timeline] = await Promise.all([
    getDashboardSummary(userId),
    getTodayChallenges().then((r) => r.challenges),
    getProgressTimeline(userId, 7),
  ]);

  return (
    <DashboardWithChallengesView
      summary={summary}
      todayChallenges={todayChallenges}
      weeklyTimeline={timeline.points}
    />
  );
}
