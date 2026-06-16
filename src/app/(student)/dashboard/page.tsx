import { redirect } from "next/navigation";
import { DashboardWithChallengesView } from "@/components/student/dashboard-with-challenges-view";
import { auth } from "@/lib/auth";
import { getTodayChallenges } from "@/server/actions/challenges";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const [summary, todayChallenges] = await Promise.all([
    getDashboardSummary(session.user.id),
    getTodayChallenges().then((r) => r.challenges),
  ]);

  return (
    <DashboardWithChallengesView
      summary={summary}
      todayChallenges={todayChallenges}
      challengesLoading={false}
    />
  );
}
