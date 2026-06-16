"use client";

import { ArrowLeft, ChevronDown, Sparkles, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import {
  ChallengeCard,
  OnDemandGenerator,
} from "@/components/student/challenge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeSource = "AUTO_DAILY" | "ON_DEMAND";

interface ChallengeListItem {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  source: ChallengeSource;
  scheduledFor: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  itemCount: number;
  completedItemCount: number;
  totalPoints: number;
  mixConfig: { questions: number; materials: number; reflections: number };
}

interface DailyProgress {
  date: string;
  totalActive: number;
  totalCompleted: number;
  totalPoints: number;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
}

interface ChallengeListViewProps {
  challenges: ChallengeListItem[];
  progress: { total: number; completed: number; points: number };
  dailyProgress: DailyProgress;
  subjectOptions: Array<{ slug: string; name: string }>;
}

type Filter = "all" | "active" | "completed";

export function ChallengeListView({
  challenges,
  progress,
  dailyProgress,
  subjectOptions,
}: ChallengeListViewProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    if (filter === "active")
      return challenges.filter((c) => c.status === "ACTIVE");
    if (filter === "completed")
      return challenges.filter((c) => c.status === "COMPLETED");
    return challenges;
  }, [challenges, filter]);

  const allDone =
    challenges.length > 0 && challenges.every((c) => c.status === "COMPLETED");
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleGenerate(input: {
    kind?: "QUESTION" | "MATERIAL" | "REFLECTION" | "MIX";
    subjectSlug?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
  }) {
    try {
      const res = await fetch("/api/challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.ok && data.challengeId) {
        router.push(`/challenge/${data.challengeId}`);
        return { ok: true, challengeId: data.challengeId };
      }
      return { ok: false, error: data.error ?? "Gagal generate" };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Network error",
      };
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.65 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                <Target size={10} strokeWidth={2.5} />
                Tantangan harian
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight sm:text-[28px]">
                Tantangan <span className="text-gradient-cool">Hari Ini</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                {today}. Campuran soal, materi, dan refleksi yang
                dipersonalisasi buat kamu.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/dashboard">
                <ArrowLeft size={13} />
                Beranda
              </Link>
            </Button>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              icon={<Target size={14} />}
              label="Tantangan"
              value={`${progress.completed}/${progress.total}`}
              color="text-[var(--purple)]"
            />
            <StatTile
              icon={<Trophy size={14} />}
              label="XP"
              value={String(progress.points)}
              color="text-[var(--coral)]"
            />
            <StatTile
              icon={<Sparkles size={14} />}
              label="Overall"
              value={`${dailyProgress.overallScore}%`}
              color="text-[var(--teal)]"
            />
            <StatTile
              icon={<Target size={14} />}
              label="Mastery"
              value={`${dailyProgress.masteryScore}%`}
              color="text-amber-600"
            />
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 p-1 backdrop-blur-sm">
            {(["all", "active", "completed"] as Filter[]).map((f) => {
              const isActive = filter === f;
              const label =
                f === "all"
                  ? "Semua"
                  : f === "active"
                    ? "Belum selesai"
                    : "Selesai";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11.5px] font-bold transition-all",
                    isActive
                      ? "bg-[var(--coral)] text-white shadow-[0_4px_10px_rgba(225,29,72,0.25)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 rounded-full text-[12px] text-muted-foreground"
            >
              <Link href="/challenge/history">
                Riwayat
                <ChevronDown size={12} />
              </Link>
            </Button>
            <OnDemandGenerator
              onGenerate={handleGenerate}
              subjectOptions={subjectOptions}
            />
          </div>
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <Reveal delay={140}>
          <div className="rounded-3xl border border-border/40 bg-card/80 p-8 text-center shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-10">
            <Sparkles size={28} className="mx-auto text-[var(--purple)]" />
            {allDone ? (
              <>
                <p className="mt-3 font-heading text-[16px] font-bold">
                  Mantap! Tantangan hari ini sudah selesai 🎉
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Kamu sudah ngerjain semuanya. Mau ulangi atau coba tantangan
                  tambahan?
                </p>
              </>
            ) : filter !== "all" ? (
              <>
                <p className="mt-3 font-heading text-[16px] font-bold">
                  Belum ada tantangan di filter ini
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Coba ganti filter atau minta tantangan tambahan.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-heading text-[16px] font-bold">
                  Belum ada tantangan
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  AI lagi nyiapin tantangan pertamamu. Coba refresh dalam
                  beberapa detik.
                </p>
              </>
            )}
          </div>
        </Reveal>
      ) : (
        <Reveal delay={140}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <p className="mt-1 font-heading text-[18px] font-bold leading-none">
        {value}
      </p>
    </div>
  );
}
