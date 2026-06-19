"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
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
  const average = Math.round(
    formattedData.reduce((acc, d) => acc + d[metric], 0) / formattedData.length,
  );

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

      <div className="h-[200px] w-full sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 12, right: 16, left: 24, bottom: 0 }}
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
              className="stroke-muted/10"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              className="text-[10px] font-medium text-muted-foreground"
              axisLine={false}
              tickLine={false}
              dy={8}
              interval={Math.floor(formattedData.length / 6)}
              minTickGap={24}
            />

            <YAxis
              className="text-[10px] font-medium text-muted-foreground"
              axisLine={false}
              tickLine={false}
              dx={-8}
              allowDecimals={false}
              width={40}
            />

            <Tooltip
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "14px",
                color: "hsl(var(--popover-foreground))",
                fontSize: "12px",
                boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.15)",
              }}
              itemStyle={{
                fontWeight: "bold",
                padding: "1px 0",
                fontSize: "11px",
              }}
              labelStyle={{
                fontWeight: "800",
                marginBottom: "4px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "11px",
              }}
              formatter={(value) => [
                `${value} ${metric === "xp" ? "XP" : "aktivitas"}`,
                metric === "xp" ? "XP" : "Aktivitas",
              ]}
            />

            <ReferenceLine
              y={average}
              className="stroke-muted-foreground/50"
              strokeDasharray="4 4"
              strokeWidth={1}
            >
              <text
                x="100%"
                y={average}
                dy={-4}
                textAnchor="end"
                className="fill-muted-foreground/70 text-[9px]"
              >
                rata-rata
              </text>
            </ReferenceLine>

            <Area
              type="monotone"
              dataKey={metric}
              stroke={metric === "xp" ? "#f59e0b" : "var(--coral)"}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradActivity)"
              dot={{
                r: 2,
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
