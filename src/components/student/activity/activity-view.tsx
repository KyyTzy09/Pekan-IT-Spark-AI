"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Reveal } from "@/components/shared/reveal";
import { ActivityHeatmap } from "@/components/student/activity/activity-heatmap";
import { ActivityList } from "@/components/student/activity/activity-list";
import { ActivityStats } from "@/components/student/activity/activity-stats";

const ActivityLineChart = dynamic(
  () =>
    import("@/components/student/activity/activity-line-chart").then(
      (m) => m.ActivityLineChart,
    ),
  { ssr: false },
);

import type { StudentActivity } from "@/server/actions/activity";

type Props = {
  activity: StudentActivity;
  studentName: string;
  currentLevel: number;
  totalXp: number;
};

export function ActivityView({
  activity,
  studentName,
  currentLevel,
  totalXp,
}: Props) {
  const [chartMetric, setChartMetric] = useState<"count" | "xp">("count");

  return (
    <div className="space-y-6 pb-20 sm:space-y-8">
      <ActivityStats
        activity={activity}
        studentName={studentName}
        currentLevel={currentLevel}
        totalXp={totalXp}
      />

      <Reveal>
        <ActivityHeatmap data={activity.heatmap} />
      </Reveal>

      <Reveal className="grid gap-6 lg:grid-cols-2">
        <ActivityLineChart data={activity.dailySeries} metric={chartMetric} />
        <div className="lg:max-h-[420px] lg:overflow-y-auto">
          <ActivityList entries={activity.recent} limit={20} />
        </div>
      </Reveal>

      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-border/40 bg-card/60 p-1 text-[11.5px] font-bold">
          <button
            type="button"
            onClick={() => setChartMetric("count")}
            className={`rounded-full px-3.5 py-1.5 transition-all ${
              chartMetric === "count"
                ? "bg-[var(--coral)] text-white shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Count
          </button>
          <button
            type="button"
            onClick={() => setChartMetric("xp")}
            className={`rounded-full px-3.5 py-1.5 transition-all ${
              chartMetric === "xp"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            XP
          </button>
        </div>
      </div>
    </div>
  );
}
