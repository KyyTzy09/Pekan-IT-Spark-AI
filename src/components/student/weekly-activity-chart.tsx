"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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

interface WeeklyActivityChartProps {
  points: TimelinePoint[];
}

const DAYS_INDONESIAN = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function WeeklyActivityChart({ points }: WeeklyActivityChartProps) {
  if (points.length === 0) return null;

  const formattedData = points.slice(-7).map((pt) => {
    const d = new Date(pt.date);
    const dayLabel = DAYS_INDONESIAN[d.getDay()] || pt.date;
    return {
      ...pt,
      label: dayLabel,
    };
  });

  return (
    <div className="h-[180px] w-full sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--coral)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--coral)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradChallenge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--teal)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradMastery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--purple)" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/15"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            className="text-[9px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            domain={[0, 100]}
            className="text-[9px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dx={-4}
            tickFormatter={(v) => `${v}`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.85)",
              borderColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "11px",
              boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.15)",
            }}
            itemStyle={{
              fontWeight: "bold",
              padding: "1px 0",
              fontSize: "10.5px",
            }}
            labelStyle={{
              fontWeight: "800",
              marginBottom: "4px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "10px",
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                overallScore: "Skor Keseluruhan",
                challengeScore: "Tantangan",
                masteryScore: "Penguasaan",
              };
              return [`${value}%`, labels[String(name)] || String(name)];
            }}
          />

          <Area
            type="monotone"
            dataKey="overallScore"
            stroke="var(--coral)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradOverall)"
            name="overallScore"
            dot={{
              r: 3,
              fill: "var(--coral)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              stroke: "var(--coral)",
              strokeWidth: 2,
              fill: "var(--background)",
            }}
          />

          <Area
            type="monotone"
            dataKey="challengeScore"
            stroke="var(--teal)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#gradChallenge)"
            name="challengeScore"
          />

          <Area
            type="monotone"
            dataKey="masteryScore"
            stroke="var(--purple)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            fillOpacity={1}
            fill="url(#gradMastery)"
            name="masteryScore"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
