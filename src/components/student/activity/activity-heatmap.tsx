"use client";

import { Calendar, Flame, Sparkles, TrendingUp } from "lucide-react";
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

const LEVEL_BG_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40",
  1: "bg-emerald-200 dark:bg-emerald-900/60",
  2: "bg-emerald-400 dark:bg-emerald-700/70",
  3: "bg-emerald-500 dark:bg-emerald-500/80",
  4: "bg-emerald-600 dark:bg-emerald-400",
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

  const parseLocal = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const firstDate = parseLocal(first.date);
  const lastDate = parseLocal(last.date);

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
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    const ymd = `${y}-${m}-${day}`;
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
      const d = parseLocal(firstCell.date);
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

  // Calculate learning metrics
  const activeDaysCount = data.filter((d) => d.count > 0).length;
  const avgActivitiesPerActiveDay =
    activeDaysCount > 0 ? (totalCount / activeDaysCount).toFixed(1) : "0";

  // Calculate most active day of the week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
  for (const d of data) {
    if (d.count > 0) {
      const date = parseLocal(d.date);
      const dayIdx = date.getDay();
      dayCounts[dayIdx] += d.count;
    }
  }
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  let maxDayIdx = 1;
  let maxDayVal = -1;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > maxDayVal) {
      maxDayVal = dayCounts[i];
      maxDayIdx = i;
    }
  }
  const mostActiveDayName = maxDayVal > 0 ? dayNames[maxDayIdx] : "Senin";

  return (
    <section
      className={cn(
        "rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl space-y-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/10 pb-3">
        <Calendar size={16} className="text-muted-foreground" />
        <h3 className="font-heading text-sm font-bold text-foreground">
          Peta Aktivitas Belajar
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Heatmap (scrollable) */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto pb-2 custom-scrollbar min-w-full">
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Heatmap aktivitas"
                className="select-none"
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
                    y={
                      monthLabelHeight +
                      dow * (cellSize + cellGap) +
                      cellSize -
                      2
                    }
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
                        className={cn(
                          LEVEL_COLORS[cell.level],
                          "transition-colors",
                        )}
                      >
                        <title>
                          {cell.date}: {cell.count} aktivitas
                        </title>
                      </rect>
                    );
                  }),
                )}
              </svg>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10.5px] text-muted-foreground font-medium pt-3 border-t border-border/5 gap-2">
            <span>
              Rentang: {data.length} hari terakhir • {totalCount} total
              aktivitas
            </span>
            <Legend />
          </div>
        </div>

        {/* Right Side: Learning Stats Panel (fills the empty space) */}
        <div className="w-full lg:w-[220px] shrink-0 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-border/10 pt-4 lg:pt-0 lg:pl-5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Statistik Aktivitas
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
            {/* Stat Item 1 */}
            <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Flame size={13} className="fill-emerald-500/10" />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                  Teraktif
                </p>
                <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                  {mostActiveDayName}
                </p>
              </div>
            </div>
            {/* Stat Item 2 */}
            <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-[var(--coral)]/10 flex items-center justify-center text-[var(--coral)] shrink-0">
                <TrendingUp size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                  Rata-rata
                </p>
                <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                  {avgActivitiesPerActiveDay} aksi/hari
                </p>
              </div>
            </div>
            {/* Stat Item 3 */}
            <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                <Calendar size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                  Hari Aktif
                </p>
                <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                  {activeDaysCount} Hari
                </p>
              </div>
            </div>
            {/* Stat Item 4 */}
            <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Sparkles size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                  Total Aksi
                </p>
                <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                  {totalCount} Aksi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityHeatmapDetail
        date={selectedDate ?? ""}
        entries={entries}
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      />
    </section>
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
              LEVEL_BG_COLORS[lvl as 0 | 1 | 2 | 3 | 4],
            )}
          />
        ))}
      </div>
      <span>Banyak</span>
    </div>
  );
}
