"use client";

import { useState } from "react";
import { ActivityHeatmapDetail } from "@/components/student/activity/activity-heatmap-detail";
import { cn } from "@/lib/utils";
import type {
  ActivityEntry,
  ActivityHeatmapDay,
} from "@/server/actions/activity";

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "fill-muted/40",
  1: "fill-emerald-200 dark:fill-emerald-900/60",
  2: "fill-emerald-400 dark:fill-emerald-700/70",
  3: "fill-emerald-500 dark:fill-emerald-500/80",
  4: "fill-emerald-600 dark:fill-emerald-400",
};

const MONTH_LABELS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

type Props = {
  data: ActivityHeatmapDay[];
  entries: ActivityEntry[];
  className?: string;
};

/**
 * GitHub-style activity heatmap.
 * 53 weeks × 7 days, color intensity = number of activities that day.
 *
 * Layout: weekday rows (Sun..Sat) on Y, weeks on X.
 * Month labels appear above the first week of each new month.
 */
export function ActivityHeatmap({ data, entries, className }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-8 text-center text-muted-foreground">
        Belum ada data aktivitas.
      </div>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return null;

  const firstDate = new Date(first.date);
  const lastDate = new Date(last.date);

  // Pad the start so the first column is Sunday-aligned
  const firstDow = firstDate.getDay(); // 0 = Sun
  const paddedStart = new Date(firstDate);
  paddedStart.setDate(paddedStart.getDate() - firstDow);

  // Build grid: array of weeks, each week = 7 days (Sun..Sat)
  const cells: Array<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  } | null> = [];
  const lookup = new Map(data.map((d) => [d.date, d]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cursor = new Date(paddedStart);
  while (cursor <= lastDate || cursor.getDay() !== 0) {
    const ymd = cursor.toISOString().split("T")[0] ?? "";
    const entry = lookup.get(ymd);
    if (entry && cursor >= firstDate) {
      cells.push({
        date: entry.date,
        count: entry.count,
        level: entry.level,
      });
    } else {
      cells.push(null); // padding or future
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Reshape into weeks (groups of 7)
  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Find column index where each new month starts (for month labels)
  const monthStarts: Array<{ col: number; monthIdx: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstCell = week.find((c) => c !== null);
    if (firstCell) {
      const d = new Date(firstCell.date);
      if (d.getMonth() !== lastMonth) {
        monthStarts.push({ col: colIdx, monthIdx: d.getMonth() });
        lastMonth = d.getMonth();
      }
    }
  });

  const cellSize = 11;
  const cellGap = 3;
  const labelWidth = 28;
  const monthLabelHeight = 18;
  const width = labelWidth + weeks.length * (cellSize + cellGap);
  const height = monthLabelHeight + 7 * (cellSize + cellGap);

  // Total counts (for legend)
  const totalCount = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-[15px] font-bold text-foreground">
            Peta aktivitas
          </h3>
          <p className="text-[11.5px] text-muted-foreground">
            {data.length} hari terakhir • {totalCount} aktivitas
          </p>
        </div>
        <Legend />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card/30 p-4">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Heatmap aktivitas"
        >
          {/* Month labels */}
          {monthStarts.map((m) => (
            <text
              key={`m-${m.col}`}
              x={labelWidth + m.col * (cellSize + cellGap)}
              y={12}
              className="fill-muted-foreground"
              fontSize={10}
              fontWeight={600}
            >
              {MONTH_LABELS_ID[m.monthIdx]}
            </text>
          ))}

          {/* Day labels (left side, only Mon/Wed/Fri for compactness) */}
          {[1, 3, 5].map((dow) => (
            <text
              key={`d-${dow}`}
              x={0}
              y={monthLabelHeight + dow * (cellSize + cellGap) + cellSize - 2}
              className="fill-muted-foreground"
              fontSize={9}
            >
              {DAY_LABELS[dow]}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, colIdx) =>
            week.map((cell, rowIdx) => {
              if (!cell) return null;
              const clickable = cell.count > 0;
              if (clickable) {
                return (
                  // biome-ignore lint/a11y/useSemanticElements: SVG rect cannot use <button>, role="button" is the correct pattern
                  <rect
                    key={cell.date}
                    x={labelWidth + colIdx * (cellSize + cellGap)}
                    y={monthLabelHeight + rowIdx * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    role="button"
                    tabIndex={0}
                    aria-label={`${cell.date}: ${cell.count} aktivitas, klik untuk detail`}
                    className={cn(
                      LEVEL_COLORS[cell.level],
                      "cursor-pointer transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    )}
                    onClick={() => setSelectedDate(cell.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDate(cell.date);
                      }
                    }}
                  >
                    <title>
                      {cell.date}: {cell.count} aktivitas
                    </title>
                  </rect>
                );
              }
              return (
                <rect
                  key={cell.date}
                  x={labelWidth + colIdx * (cellSize + cellGap)}
                  y={monthLabelHeight + rowIdx * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  className={cn(LEVEL_COLORS[cell.level], "transition-colors")}
                >
                  <title>
                    {cell.date}: {cell.count} aktivitas
                  </title>
                </rect>
              );
            }),
          )}
        </svg>

        <ActivityHeatmapDetail
          date={selectedDate ?? ""}
          entries={entries}
          open={selectedDate !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null);
          }}
        />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
      <span>Sedikit</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span
            key={lvl}
            className={cn(
              "size-3 rounded-sm",
              LEVEL_COLORS[lvl as 0 | 1 | 2 | 3 | 4],
            )}
          />
        ))}
      </div>
      <span>Banyak</span>
    </div>
  );
}
