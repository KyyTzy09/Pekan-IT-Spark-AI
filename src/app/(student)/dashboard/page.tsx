import { redirect } from "next/navigation";
import { DashboardWithChallengesView } from "@/components/student/dashboard-with-challenges-view";
import { getSession } from "@/lib/session";
import {
  getProgressTimeline,
  getTodayChallenges,
} from "@/server/actions/challenges";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  console.log("[DASHBOARD] Session:", {
    id: session?.id,
    isOnboarded: session?.isOnboarded,
    role: session?.role,
  });
  if (!session?.id) {
    console.log("[DASHBOARD] No session, redirecting to /auth/login");
    redirect("/auth/login");
  }
  if (session.role === "PARENT") {
    console.log("[DASHBOARD] Role is PARENT, redirecting to /parent");
    redirect("/parent");
  }
  if (session.role !== "STUDENT") {
    console.log("[DASHBOARD] Role is not STUDENT, redirecting to /auth/login");
    redirect("/auth/login");
  }

  const userId = session.id;

  const [summary, todayChallenges, timeline] = await Promise.all([
    getDashboardSummary(userId).catch(() => ({
      student: {
        id: userId,
        name: "",
        grade: null,
        school: null,
        learningStyle: null,
      },
      greeting: "Halo!",
      greetingSubtitle: "",
      sparkTip: "",
      streak: { current: 0, longest: 0, freezeAvailable: 0 },
      level: {
        level: 1,
        name: "Pemula",
        totalXp: 0,
        currentMinXp: 0,
        nextMinXp: null,
        progress: 0,
        xpToNext: null,
      },
      subjects: [],
      totalMastered: 0,
      totalConcepts: 0,
      totalAttempts: 0,
      recommendation: null,
      recentDocuments: 0,
    })),
    getTodayChallenges()
      .then((r) => r.challenges)
      .catch(() => []),
    getProgressTimeline(userId, 7)
      .then((r) => r.points)
      .catch(() => []),
  ]);

  return (
    <DashboardWithChallengesView
      summary={summary}
      todayChallenges={todayChallenges ?? []}
      weeklyTimeline={timeline ?? []}
    />
  );
}
