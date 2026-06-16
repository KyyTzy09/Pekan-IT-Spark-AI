"use client";

import { Reveal } from "@/components/shared/reveal";
import { DailyChallengeSummary } from "@/components/student/challenge/daily-challenge-summary";
import { DashboardView } from "@/components/student/dashboard-view";
import type { DashboardSummary } from "@/server/actions/dashboard";

type ChallengeListItem = {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  source: "AUTO_DAILY" | "ON_DEMAND";
  scheduledFor: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  itemCount: number;
  completedItemCount: number;
  totalPoints: number;
  mixConfig: { questions: number; materials: number; reflections: number };
};

export function DashboardWithChallengesView({
  summary,
  todayChallenges,
  challengesLoading,
}: {
  summary: DashboardSummary;
  todayChallenges: ChallengeListItem[];
  challengesLoading: boolean;
}) {
  const showChallenges = todayChallenges.length > 0 || challengesLoading;

  return (
    <div className="space-y-5 sm:space-y-7">
      <DashboardView summary={summary} />
      {showChallenges && (
        <Reveal>
          <DailyChallengeSummary challenges={todayChallenges} />
        </Reveal>
      )}
    </div>
  );
}
