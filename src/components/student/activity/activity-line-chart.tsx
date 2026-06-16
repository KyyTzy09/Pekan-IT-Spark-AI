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
import { cn } from "@/lib/utils";
import type { DailySeriesPoint } from "@/server/actions/activity";

type Props = {
  data: DailySeriesPoint[];
  className?: string;
  metric?: "count" | "xp";
};

/**
 * Line chart for daily activity series (count or XP).
 * Uses recharts for consistency with other student charts.
 */
export function ActivityLineChart({
  data,
  className,
  metric = "count",
}: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-8 text-center text-muted-foreground">
        Belum ada data grafik.
      </div>
    );
  }

  const formattedData = data.map((d) => {
    const dt = new Date(d.date);
    const day = dt.getDate();
    const month = dt.toLocaleDateString("id-ID", { month: "short" });
    return {
      ...d,
      label: `${day} ${month}`,
    };
  });

  const max = Math.max(1, ...formattedData.map((d) => d[metric]));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-[15px] font-bold text-foreground">
            {metric === "count" ? "Aktivitas harian" : "XP harian"}
          </h3>
          <p className="text-[11.5px] text-muted-foreground">
            30 hari terakhir • max {max} {metric === "xp" ? "XP" : "aktivitas"}
            /hari
          </p>
        </div>
      </div>

      <div className="h-[180px] w-full sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={metric === "xp" ? "#f59e0b" : "var(--coral)"}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={metric === "xp" ? "#f59e0b" : "var(--coral)"}
                  stopOpacity={0}
                />
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
              interval="preserveStartEnd"
            />

            <YAxis
              className="text-[9px] font-bold text-muted-foreground"
              axisLine={false}
              tickLine={false}
              dx={-4}
              allowDecimals={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(30, 41, 59, 0.92)",
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
              formatter={(value) => [
                `${value} ${metric === "xp" ? "XP" : "aktivitas"}`,
                metric === "xp" ? "XP" : "Aktivitas",
              ]}
            />

            <Area
              type="monotone"
              dataKey={metric}
              stroke={metric === "xp" ? "#f59e0b" : "var(--coral)"}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradActivity)"
              dot={{
                r: 3,
                fill: metric === "xp" ? "#f59e0b" : "var(--coral)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                stroke: metric === "xp" ? "#f59e0b" : "var(--coral)",
                strokeWidth: 2,
                fill: "var(--background)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
