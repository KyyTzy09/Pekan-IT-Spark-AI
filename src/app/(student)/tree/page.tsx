import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/server/actions/dashboard";
import { getStudyBuddyAction } from "@/server/actions/gamification";
import { Tree3DView } from "@/components/student/tree-3d-view";

export const metadata: Metadata = {
  title: "Pohon Kehidupan — Spark AI",
  description: "Lihat pertumbuhan pohon belajarmu dalam 3D.",
};

export const dynamic = "force-dynamic";

export default async function TreePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const userId = session.user.id;

  const [summary, buddy] = await Promise.all([
    getDashboardSummary(userId).catch(() => null),
    getStudyBuddyAction().catch(() => null),
  ]);

  if (!summary) redirect("/dashboard");

  const totalConcepts = summary.totalConcepts || 1;
  const avgMasteryPct = Math.round(
    (summary.totalMastered / totalConcepts) * 100,
  );

  return (
    <Tree3DView
      level={summary.level.level}
      totalXp={summary.level.totalXp}
      totalMastered={summary.totalMastered}
      totalConcepts={summary.totalConcepts}
      avgMasteryPct={avgMasteryPct}
      buddyType={buddy?.buddy?.type ?? "bunga"}
    />
  );
}
