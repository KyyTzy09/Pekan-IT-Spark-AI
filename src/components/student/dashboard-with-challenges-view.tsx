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
  status: "GENERATING" | "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
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

// Adaptive polling: start fast, slow down as we wait
const POLL_INTERVALS = [3000, 3000, 5000, 5000, 8000, 8000, 10000, 10000, 10000, 10000, 15000, 15000];
const MAX_POLLS = POLL_INTERVALS.length;

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
  const [generating, setGenerating] = useState(false);
  const [pollError, setPollError] = useState(false);
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
      if (!active) return;

      // First check status endpoint (lightweight)
      fetch("/api/challenge/status")
        .then((res) => res.json())
        .then((status) => {
          if (!active) return;

          if (status.generating) {
            setGenerating(true);
            // Still generating — keep polling
            if (pollCount.current < MAX_POLLS) {
              pollCount.current++;
              const interval = POLL_INTERVALS[pollCount.current] ?? 10000;
              pollTimerRef.current = setTimeout(poll, interval);
            } else {
              setGenerating(false);
              setPollError(true);
              setLoading(false);
            }
            return;
          }

          // Not generating — fetch actual challenges
          return fetch("/api/challenge/today");
        })
        .then((res) => {
          if (!res || !active) return;
          if (!res.ok) throw new Error("Failed to fetch challenges");
          return res.json();
        })
        .then((json) => {
          if (!active || !json) return;
          if (json.challenges?.length > 0) {
            setChallenges(json.challenges);
            setGenerating(false);
            setLoading(false);
          } else if (pollCount.current < MAX_POLLS) {
            // No challenges yet but not generating — maybe just started
            pollCount.current++;
            const interval = POLL_INTERVALS[pollCount.current] ?? 10000;
            pollTimerRef.current = setTimeout(poll, interval);
          } else {
            setGenerating(false);
            setPollError(true);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("[dashboard] poll failed:", err);
          if (active) {
            setGenerating(false);
            setPollError(true);
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

  const showChallenges = challenges.length > 0 || loading || pollError;

  return (
    <div className="space-y-5 sm:space-y-7">
      <DashboardView summary={summary} />

      {showChallenges && (
        <Reveal>
          <DailyChallengeSummary
            challenges={challenges}
            loading={loading}
            generating={generating}
            error={pollError}
          />
        </Reveal>
      )}

      {weeklyTimeline && weeklyTimeline.length > 0 && (
        <Reveal>
          <div>{/* Weekly timeline chart would go here */}</div>
        </Reveal>
      )}
    </div>
  );
}
