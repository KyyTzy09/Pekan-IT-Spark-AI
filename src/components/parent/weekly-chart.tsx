"use client";

import dynamic from "next/dynamic";

type TimelinePoint = {
  date: string;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
};

interface WeeklyChartProps {
  points: TimelinePoint[];
}

export const WeeklyChart = dynamic<WeeklyChartProps>(
  () => import("./weekly-chart-impl").then((m) => m.WeeklyChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full sm:h-[300px] bg-card/10 animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
        Memuat grafik aktivitas...
      </div>
    ),
  },
);
