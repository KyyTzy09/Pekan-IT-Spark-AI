"use client";

import { Award, Flame, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Metrics {
  streak: { current: number; longest: number };
  level: {
    level: number;
    name: string;
    progress: number;
    totalXp: number;
    xpToNext?: number | null;
  };
  weeklyScore: number;
}

export function MetricsOverview({ metrics }: { metrics: Metrics }) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {/* Streak Card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-muted-foreground">
            Streak Belajar
          </span>
          <span className="grid size-8 place-items-center rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Flame size={16} fill="currentColor" strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-heading text-[32px] font-extrabold leading-none text-foreground">
            {metrics.streak.current}
          </span>
          <span className="text-[12px] font-medium text-muted-foreground">
            hari berturut-turut
          </span>
        </div>
        <p className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed">
          Streak terlama yang pernah dicapai: **{metrics.streak.longest} hari**.
        </p>
      </div>

      {/* Level / XP Progress Card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-muted-foreground">
            Level Belajar
          </span>
          <span className="grid size-8 place-items-center rounded-xl bg-[var(--blue)]/10 text-[var(--blue)]">
            <Award size={16} strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="font-heading text-[30px] font-extrabold leading-none text-foreground">
            Level {metrics.level.level}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--blue)] ml-1">
            {metrics.level.name}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          <Progress
            value={metrics.level.progress}
            className="h-2 rounded-full"
          />
          <div className="flex justify-between text-[9.5px] font-bold text-muted-foreground">
            <span>{metrics.level.totalXp} XP</span>
            {metrics.level.xpToNext ? (
              <span>{metrics.level.xpToNext} XP ke Level Berikutnya</span>
            ) : (
              <span>Tingkat Maksimum</span>
            )}
          </div>
        </div>
      </div>

      {/* Overall Activity Score Card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-muted-foreground">
            Skor Keaktifan Mingguan
          </span>
          <span className="grid size-8 place-items-center rounded-xl bg-[var(--teal)]/10 text-[var(--teal)]">
            <Target size={16} strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-heading text-[32px] font-extrabold leading-none text-foreground">
            {metrics.weeklyScore}
          </span>
          <span className="text-[12px] font-medium text-muted-foreground">
            / 100 poin
          </span>
        </div>
        <p className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed">
          Dihitung otomatis berdasarkan penguasaan konsep, tantangan harian, dan
          refleksi.
        </p>
      </div>
    </section>
  );
}
