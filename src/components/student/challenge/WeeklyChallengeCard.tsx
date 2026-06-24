"use client";

import { CheckCircle, Settings2, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeeklyChallengeData {
  id: string;
  title: string;
  description: string | null;
  goal: number;
  progress: number;
  completed: boolean;
  xpRewarded: boolean;
  weekStart: string;
}

interface WeeklyChallengeCardProps {
  weeklyChallenge: WeeklyChallengeData;
  onClaimReward: () => Promise<{ ok: boolean; error?: string }>;
  onPickSubjects?: () => void;
  showSubjectPicker?: boolean;
  subjectCount?: number;
}

export function WeeklyChallengeCard({
  weeklyChallenge,
  onClaimReward,
  onPickSubjects,
  showSubjectPicker,
  subjectCount,
}: WeeklyChallengeCardProps) {
  const router = useRouter();
  const [claiming, setClaiming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const progressPct = weeklyChallenge.goal > 0
    ? Math.round((weeklyChallenge.progress / weeklyChallenge.goal) * 100)
    : 0;

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await onClaimReward();
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "Gagal mengklaim hadiah");
      }
    } catch (_e) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--purple)]/20 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--coral)]/5 p-5 shadow-[0_8px_24px_rgba(139,92,246,0.06)] backdrop-blur-md sm:p-6">
      {/* Decorative Blur Spheres */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-[var(--purple)]/10 opacity-40 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -bottom-12 size-36 rounded-full bg-[var(--coral)]/10 opacity-40 blur-2xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--purple)]">
            <Trophy size={10} strokeWidth={2.5} />
            Misi Mingguan
          </span>
          <h3 className="mt-2 font-heading text-[16px] font-bold leading-tight sm:text-[18px]">
            {weeklyChallenge.title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {weeklyChallenge.description ||
              "Selesaikan tantangan harian minggu ini."}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <div className="text-[12.5px] font-bold">
            <span className="text-[var(--purple)] font-heading text-[15px]">
              {weeklyChallenge.progress}
            </span>{" "}
            / {weeklyChallenge.goal} item selesai
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Bonus +200 XP
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        {/* Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              weeklyChallenge.completed
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : "bg-gradient-to-r from-[var(--purple)] to-[var(--coral)]",
            )}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10.5px] text-muted-foreground font-medium">
          Dihitung dari seluruh aktivitas harian yang selesai minggu ini
        </span>

        <div>
          {weeklyChallenge.xpRewarded ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle size={12} strokeWidth={2.5} />
              Hadiah Diklaim (+200 XP)
            </span>
          ) : weeklyChallenge.completed ? (
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={claiming}
              className="relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--coral)] text-white shadow-lg shadow-[var(--purple)]/20 hover:opacity-90 animate-pulse"
            >
              <Sparkles size={12} className="mr-1" />
              {claiming ? "Mengklaim..." : "Klaim 200 XP"}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              Belum Selesai
            </span>
          )}
        </div>
      </div>

      {showSubjectPicker && onPickSubjects && (
        <div className="relative mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onPickSubjects}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--purple)]/30 bg-[var(--purple)]/5 px-2.5 py-1 text-[11px] font-bold text-[var(--purple)] transition-all hover:bg-[var(--purple)]/10"
          >
            <Settings2 size={10} strokeWidth={2.5} />
            Atur mapel minggu ini
            {typeof subjectCount === "number" && (
              <span className="rounded-full bg-[var(--purple)]/15 px-1.5 py-0.5 text-[10px]">
                {subjectCount}/4
              </span>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-center text-[11px] font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
