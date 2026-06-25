import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThreeErrorBoundary } from "@/components/shared/three-error-boundary";
import { Tree3DView } from "@/components/student/tree-3d-view";
import { getSession } from "@/lib/session";
import { getDashboardSummary } from "@/server/actions/dashboard";
import { getStudyBuddyAction } from "@/server/actions/gamification";

export const metadata: Metadata = {
  title: "Pohon Kehidupan — Spark AI",
  description: "Lihat pertumbuhan pohon belajarmu dalam 3D.",
};

export const dynamic = "force-dynamic";

export default async function TreePage() {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  const userId = session.id;

  const [summary, buddyResult] = await Promise.all([
    getDashboardSummary(userId).catch(() => null),
    getStudyBuddyAction().catch(() => null),
  ]);

  if (!summary) redirect("/dashboard");

  const totalConcepts = summary.totalConcepts || 1;
  const avgMasteryPct = Math.round(
    (summary.totalMastered / totalConcepts) * 100,
  );

  const buddy =
    buddyResult && "buddy" in buddyResult ? buddyResult.buddy : null;

  return (
    <ThreeErrorBoundary>
      <Tree3DView
      studentName={summary.student.name}
      level={summary.level.level}
      levelName={summary.level.name}
      totalXp={summary.level.totalXp}
      levelProgress={summary.level.progress}
      xpToNext={summary.level.xpToNext}
      totalMastered={summary.totalMastered}
      totalConcepts={summary.totalConcepts}
      avgMasteryPct={avgMasteryPct}
      totalAttempts={summary.totalAttempts}
      streakCurrent={summary.streak.current}
      streakLongest={summary.streak.longest}
      streakFreeze={summary.streak.freezeAvailable}
      subjects={summary.subjects.map((s) => ({
        name: s.name,
        icon: s.icon,
        color: s.color,
        masteryPct: s.masteryPct,
        masteredConcepts: s.masteredConcepts,
        totalConcepts: s.totalConcepts,
        learningConcepts: s.learningConcepts,
        strugglingConcepts: s.strugglingConcepts,
      }))}
      recommendation={
        summary.recommendation
          ? {
              conceptName: summary.recommendation.conceptName,
              subjectName: summary.recommendation.subjectName,
              reason: summary.recommendation.reason,
              status: summary.recommendation.status,
              masteryScore: summary.recommendation.masteryScore,
            }
          : null
      }
      sparkTip={summary.sparkTip}
      buddyType={buddy?.type ?? "bunga"}
      buddyStage={buddy?.stage ?? 1}
    />
    </ThreeErrorBoundary>
  );
}
