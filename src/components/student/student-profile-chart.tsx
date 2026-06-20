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

type ChartDataPoint = {
  date: string;
  label: string;
  xp: number;
};

export function StudentProfileChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-[200px] w-full sm:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradXp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--coral)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--coral)" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/15"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            className="text-[9px] sm:text-[10px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            className="text-[9px] sm:text-[10px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dx={-4}
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
            formatter={(value) => [`${value} XP`, "Perolehan XP"]}
          />

          <Area
            type="monotone"
            dataKey="xp"
            stroke="var(--coral)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradXp)"
            name="xp"
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
