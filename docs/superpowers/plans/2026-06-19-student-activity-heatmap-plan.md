# Student Activity Heatmap + Daily Chart UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Heatmap activity student bisa diklik untuk melihat detail aktivitas harian, dan grafik aktivitas harian diperpolish UI/UX-nya.

**Architecture:** Reuse data `activity.recent` yang sudah ada; filter client-side berdasarkan tanggal klik. Heatmap ditambahkan state dialog lokal. Grafik harian tetap area chart dengan polish axis, tooltip, grid, dan reference line.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui Dialog, Recharts, Biome, tsc.

## Global Constraints
- `src/components/student/activity/` untuk komponen activity student.
- `"use client"` hanya untuk komponen yang membutuhkan state/event handler.
- Wajib `bun run lint` dan `bun run typecheck` sebelum selesai.
- Tidak menambahkan dependency baru.
- Data detail heatmap dibatasi oleh `activity.recent` (max 50 entry terakhir).

---

## Task 1: Create ActivityHeatmapDetail dialog component

**Files:**
- Create: `src/components/student/activity/activity-heatmap-detail.tsx`

**Interfaces:**
- Consumes: `entries: ActivityEntry[]`, `date: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`.
- Produces: `ActivityHeatmapDetail` component that renders a Dialog.

- [ ] **Step 1: Create the component file**

Create `src/components/student/activity/activity-heatmap-detail.tsx` with:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Flame,
  MessageCircle,
  Target,
  Trophy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry, ActivityKind } from "@/server/actions/activity";

const KIND_META: Record<
  ActivityKind,
  { icon: typeof Trophy; color: string; label: string }
> = {
  QUESTION: { icon: Target, color: "text-[var(--coral)] bg-[var(--coral)]/10", label: "Soal" },
  MATERIAL: { icon: BookOpen, color: "text-[var(--teal)] bg-[var(--teal)]/10", label: "Materi" },
  REFLECTION: { icon: MessageCircle, color: "text-[var(--purple)] bg-[var(--purple)]/10", label: "Refleksi" },
  CHAT: { icon: MessageCircle, color: "text-[var(--orange)] bg-[var(--orange)]/10", label: "Chat" },
  BADGE: { icon: Award, color: "text-amber-600 bg-amber-500/10", label: "Badge" },
  STREAK: { icon: Flame, color: "text-amber-600 bg-amber-500/10", label: "Streak" },
  CHALLENGE: { icon: Trophy, color: "text-[var(--pink)] bg-[var(--pink)]/10", label: "Tantangan" },
};

const PREVIEW_LIMIT = 5;

function longDateLabel(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  date: string;
  entries: ActivityEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ActivityHeatmapDetail({ date, entries, open, onOpenChange }: Props) {
  const [showAll, setShowAll] = useState(false);

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => e.timestamp.startsWith(date))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [entries, date]);

  const byKind = useMemo(() => {
    const counts: Partial<Record<ActivityKind, number>> = {};
    for (const e of dayEntries) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    }
    return counts;
  }, [dayEntries]);

  const visible = showAll ? dayEntries : dayEntries.slice(0, PREVIEW_LIMIT);
  const hasMore = dayEntries.length > PREVIEW_LIMIT;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{longDateLabel(date)}</DialogTitle>
          <DialogDescription>
            {dayEntries.length} aktivitas
          </DialogDescription>
        </DialogHeader>

        {dayEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada aktivitas di hari ini.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(byKind) as ActivityKind[]).map((kind) => {
                const meta = KIND_META[kind];
                const count = byKind[kind] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={kind}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      meta.color,
                    )}
                  >
                    <meta.icon size={12} />
                    {meta.label} {count}
                  </div>
                );
              })}
            </div>

            <ol className="space-y-2">
              {visible.map((e) => {
                const meta = KIND_META[e.kind];
                const Icon = meta.icon;
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/60 p-3"
                  >
                    <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", meta.color)}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12.5px] font-bold text-foreground">{e.title}</p>
                        <time dateTime={e.timestamp} className="shrink-0 text-[10px] font-medium text-muted-foreground">
                          {formatDistanceToNow(new Date(e.timestamp))}
                        </time>
                      </div>
                      {e.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{e.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider", meta.color)}>
                          {meta.label}
                        </span>
                        {e.subjectName && <span className="text-[10px] text-muted-foreground">{e.subjectName}</span>}
                        {e.xp > 0 && (
                          <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                            +{e.xp} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? "Tampilkan lebih sedikit" : `Lihat semua ${dayEntries.length} aktivitas`}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify file syntax**

Run:
```bash
bunx tsc --noEmit src/components/student/activity/activity-heatmap-detail.tsx
```
Expected: no errors.

---

## Task 2: Wire heatmap cell click to detail dialog

**Files:**
- Modify: `src/components/student/activity/activity-heatmap.tsx`
- Modify: `src/components/student/activity/activity-view.tsx`

**Interfaces:**
- Consumes: `ActivityHeatmapDetail` and `ActivityEntry[]`.
- Produces: `ActivityHeatmap` accepts `entries` prop and opens detail dialog on cell click.

- [ ] **Step 1: Add `entries` prop to `ActivityHeatmap` signature**

In `src/components/student/activity/activity-heatmap.tsx`:
- Add `"use client"` at the top.
- Add `import { useState } from "react"`.
- Add `import { ActivityHeatmapDetail } from "@/components/student/activity/activity-heatmap-detail"`.
- Change `Props` to include `entries: ActivityEntry[]`.

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ActivityHeatmapDetail } from "@/components/student/activity/activity-heatmap-detail";
import type { ActivityHeatmapDay, ActivityEntry } from "@/server/actions/activity";

type Props = {
  data: ActivityHeatmapDay[];
  entries: ActivityEntry[];
  className?: string;
};
```

- [ ] **Step 2: Add click state and handlers**

Inside `ActivityHeatmap` function:

```tsx
const [selectedDate, setSelectedDate] = useState<string | null>(null);
```

- [ ] **Step 3: Make cells clickable and keyboard focusable**

Replace the `<rect>` rendering block with:

```tsx
{weeks.map((week, colIdx) =>
  week.map((cell, rowIdx) => {
    if (!cell) return null;
    const clickable = cell.count > 0;
    return (
      <rect
        key={`${colIdx}-${rowIdx}`}
        x={labelWidth + colIdx * (cellSize + cellGap)}
        y={monthLabelHeight + rowIdx * (cellSize + cellGap)}
        width={cellSize}
        height={cellSize}
        rx={2}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : -1}
        aria-label={clickable ? `${cell.date}: ${cell.count} aktivitas, klik untuk detail` : `${cell.date}: tidak ada aktivitas`}
        className={cn(
          LEVEL_COLORS[cell.level],
          "transition-colors",
          clickable && "cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        )}
        onClick={() => clickable && setSelectedDate(cell.date)}
        onKeyDown={(e) => {
          if (clickable && (e.key === "Enter" || e.key === " ")) {
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
  })
)}
```

- [ ] **Step 4: Render the detail dialog**

After the `</svg>` closing tag, add:

```tsx
<ActivityHeatmapDetail
  date={selectedDate ?? ""}
  entries={entries}
  open={selectedDate !== null}
  onOpenChange={(open) => {
    if (!open) setSelectedDate(null);
  }}
/>
```

- [ ] **Step 5: Pass `entries` from `ActivityView`**

In `src/components/student/activity/activity-view.tsx`, change:

```tsx
<ActivityHeatmap data={activity.heatmap} />
```

to:

```tsx
<ActivityHeatmap data={activity.heatmap} entries={activity.recent} />
```

- [ ] **Step 6: Verify lint and typecheck**

Run:
```bash
bun run lint
bun run typecheck
```
Expected: no errors.

---

## Task 3: Polish daily activity chart

**Files:**
- Modify: `src/components/student/activity/activity-line-chart.tsx`

**Interfaces:**
- Consumes: `data: DailySeriesPoint[]`, `metric: "count" | "xp"`.
- Produces: same `ActivityLineChart` component with improved axis, tooltip, grid, and average reference line.

- [ ] **Step 1: Import `ReferenceLine`**

Add to the recharts import:

```tsx
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
```

- [ ] **Step 2: Compute average and improve formatting**

After `const max = Math.max(1, ...formattedData.map((d) => d[metric]));`, add:

```tsx
const average = Math.round(
  formattedData.reduce((acc, d) => acc + d[metric], 0) / formattedData.length,
);
```

- [ ] **Step 3: Update chart configuration**

Replace the `<AreaChart>` inner content (axes, grid, tooltip, area) with:

```tsx
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
  cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "4 4" }}
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
```

- [ ] **Step 4: Increase chart container height**

Change the chart container height from:

```tsx
<div className="h-[180px] w-full sm:h-[200px]">
```

to:

```tsx
<div className="h-[200px] w-full sm:h-[240px]">
```

- [ ] **Step 5: Verify lint and typecheck**

Run:
```bash
bun run lint
bun run typecheck
```
Expected: no errors.

---

## Task 4: Final verification

- [ ] **Step 1: Run lint and typecheck**

```bash
bun run lint
bun run typecheck
```

Expected: no errors.

- [ ] **Step 2: Manual visual check (optional)**

Start dev server:
```bash
bun run dev
```

Open `/activity` and verify:
- Klik cell heatmap yang berwarna → muncul dialog dengan tanggal, jumlah aktivitas, breakdown jenis, dan daftar aktivitas.
- Tombol "Lihat semua" muncul kalau lebih dari 5 aktivitas hari itu.
- Grafik harian lebih rapi: label sumbu tidak overlap, tooltip solid, ada garis rata-rata.

---

## Spec Coverage Review

- Heatmap click detail dialog: covered by Task 1 and Task 2.
- Daily chart UX polish: covered by Task 3.
- Accessibility (focus, aria-label, DialogTitle): covered by Task 2.
- Lint/typecheck: covered by Task 2, Task 3, and Task 4.
