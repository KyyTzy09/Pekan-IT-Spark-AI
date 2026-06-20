"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/shared/reveal";
import { DailyChallengeSummary } from "@/components/student/challenge/daily-challenge-summary";
import { DashboardView } from "@/components/student/dashboard-view";
import type { DashboardSummary } from "@/server/actions/dashboard";

type ChallengeListItem = {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  source: "AUTO_DAILY" | "AUTO_WEEKLY" | "ON_DEMAND";
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

type TimelinePoint = {
  date: string;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
};

const POLL_INTERVAL = 5000;
const MAX_POLLS = 12;

export function DashboardWithChallengesView({
  summary,
  todayChallenges: initialChallenges,
  weeklyTimeline,
}: {
  summary: DashboardSummary;
  todayChallenges: ChallengeListItem[];
  weeklyTimeline?: TimelinePoint[];
}) {
  const [challenges, setChallenges] =
    useState<ChallengeListItem[]>(initialChallenges);
  const [loading, setLoading] = useState(initialChallenges.length === 0);
  const pollCount = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (initialChallenges.length > 0) {
      setLoading(false);
      return;
    }

    let active = true;
    pollCount.current = 0;

    const poll = () => {
      fetch("/api/challenge/today")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch today's challenges");
          return res.json();
        })
        .then((json) => {
          if (!active) return;
          if (json.challenges?.length > 0) {
            setChallenges(json.challenges);
            setLoading(false);
          } else if (pollCount.current < MAX_POLLS) {
            pollCount.current++;
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch today's challenges client-side:", err);
          if (active) {
            setLoading(false);
          }
        });
    };

    setLoading(true);
    poll();

    return () => {
      active = false;
      clearTimeout(pollTimerRef.current);
    };
  }, [initialChallenges]);

  const showChallenges = challenges.length > 0 || loading;

  return (
    <div className="space-y-5 sm:space-y-7">
      <DashboardView summary={summary} weeklyTimeline={weeklyTimeline} />
      {showChallenges && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/45 bg-card/60 p-5 shadow-[0_8px_30px_rgba(80,20,50,0.04)] backdrop-blur-xl sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)]/20 opacity-75" />
                  <span className="relative inline-flex h-6 w-6 rounded-full bg-[var(--coral)]" />
                </span>
                <h4 className="mt-4 font-heading text-sm font-bold text-foreground">
                  Menyiapkan Tantangan Harian Kamu...
                </h4>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Spark sedang merancang tantangan belajar khusus untuk hari ini
                  berdasarkan materi belajarmu. Mohon tunggu sebentar ya.
                </p>
              </div>
            ) : (
              <DailyChallengeSummary challenges={challenges} />
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
