"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardWithChallengesView } from "@/components/student/dashboard-with-challenges-view";
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

type ChallengeListResponse = {
  challenges: ChallengeListItem[];
  progress: { total: number; completed: number; points: number };
};

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } =
    useQuery<DashboardSummary>({
      queryKey: ["dashboard"],
      queryFn: async () => {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        return res.json();
      },
    });

  const { data: challengesData, isLoading: challengesLoading } =
    useQuery<ChallengeListResponse>({
      queryKey: ["challenges", "today"],
      queryFn: async () => {
        const res = await fetch("/api/challenge/today");
        if (!res.ok) throw new Error("Failed to fetch challenges");
        return res.json();
      },
      retry: false,
    });

  if (summaryLoading) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="size-12 animate-pulse rounded-full bg-muted" />
              <div className="space-y-2 sm:hidden">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="hidden flex-1 space-y-2 sm:block">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-6 w-52 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="ml-auto flex gap-2 self-start sm:self-center">
              <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border/40 bg-background/40 px-3.5 py-2.5 sm:mt-6">
            <div className="size-7 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="h-36 animate-pulse rounded-2xl bg-muted" />
          <div className="h-36 animate-pulse rounded-2xl bg-muted" />
          <div className="h-36 animate-pulse rounded-2xl bg-muted" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <DashboardWithChallengesView
      summary={summary}
      todayChallenges={challengesData?.challenges ?? []}
      challengesLoading={challengesLoading}
    />
  );
}
