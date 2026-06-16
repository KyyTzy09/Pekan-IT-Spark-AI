"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

export function WeeklyChart({ points }: WeeklyChartProps) {
  // Format day names (e.g. 2026-06-16 -> "Selasa" or short format)
  const DAYS_INDONESIAN = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const formattedData = points.slice(-7).map((pt) => {
    const d = new Date(pt.date);
    const dayLabel = DAYS_INDONESIAN[d.getDay()] || pt.date;
    return {
      ...pt,
      label: dayLabel,
      "Skor Keaktifan": pt.overallScore,
      "Tantangan Harian": pt.challengeScore,
      "Materi Baca": pt.materialsScore,
      "Refleksi Diri": pt.reflectionsScore,
    };
  });

  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--blue)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorChallenge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--teal)" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/20"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            className="text-[10px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dy={8}
          />

          <YAxis
            domain={[0, 100]}
            className="text-[10px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dx={-8}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            itemStyle={{
              fontWeight: "bold",
              padding: "2px 0",
            }}
            labelStyle={{
              fontWeight: "extrabold",
              marginBottom: "6px",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={6}
            formatter={(value) => (
              <span className="text-[11px] font-extrabold text-foreground/80 hover:text-foreground">
                {value}
              </span>
            )}
          />

          <Area
            type="monotone"
            dataKey="Skor Keaktifan"
            stroke="var(--blue)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorOverall)"
          />

          <Area
            type="monotone"
            dataKey="Tantangan Harian"
            stroke="var(--teal)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorChallenge)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
