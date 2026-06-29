"use client";

import {
  ArrowLeft,
  ChevronDown,
  Settings2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import {
  ChallengeCard,
  ChallengeSubjectPicker,
  OnDemandGenerator,
  type SubjectOption,
  WeeklyChallengeCard,
} from "@/components/student/challenge";
import { Button } from "@/components/ui/button";
import { claimWeeklyChallengeReward } from "@/server/actions/challenges";

const DailyScoreGauge = dynamic(
  () =>
    import("@/components/student/student-charts").then(
      (m) => m.DailyScoreGauge,
    ),
  { ssr: false },
);

import { cn } from "@/lib/utils";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeSource = "AUTO_DAILY" | "AUTO_WEEKLY" | "ON_DEMAND";

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
  initialChallengeSubjectIds: string[];
  initialWeeklySubjectIds: string[];
  availableSubjects: SubjectOption[];
  initiallyEmpty?: boolean;
  weeklyChallenge?: any;
  hasSubjects?: boolean;
}

type StatusFilter = "today" | "week" | "all";

export function ChallengeListView({
  challenges: propChallenges,
  progress: propProgress,
  dailyProgress: propDailyProgress,
  subjectOptions,
  initialChallengeSubjectIds,
  initialWeeklySubjectIds,
  availableSubjects,
  initiallyEmpty,
  weeklyChallenge,
  hasSubjects = true,
}: ChallengeListViewProps) {
  const router = useRouter();
  const [challenges, setChallenges] =
    React.useState<ChallengeListItem[]>(propChallenges);
  const [progress, setProgress] = React.useState(propProgress);
  const [dailyProgress, setDailyProgress] = React.useState(propDailyProgress);
  const [loading, setLoading] = React.useState(!!initiallyEmpty);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("today");
  const [allChallenges, setAllChallenges] = React.useState<ChallengeListItem[]>(
    [],
  );
  const [loadingAll, setLoadingAll] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState<{
    variant: "daily" | "weekly";
  } | null>(null);
  const [pickerSnapshot, setPickerSnapshot] = React.useState<{
    daily: string[];
    weekly: string[];
  }>({
    daily: initialChallengeSubjectIds,
    weekly: initialWeeklySubjectIds,
  });

  React.useEffect(() => {
    setPickerSnapshot({
      daily: initialChallengeSubjectIds,
      weekly: initialWeeklySubjectIds,
    });
  }, [initialChallengeSubjectIds, initialWeeklySubjectIds]);

  React.useEffect(() => {
    if (!initiallyEmpty) {
      setChallenges(propChallenges);
      setProgress(propProgress);
      setDailyProgress(propDailyProgress);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch("/api/challenge/today")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch challenges");
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        setChallenges(json.challenges || []);
        setProgress(json.progress || { total: 0, completed: 0, points: 0 });
        return fetch("/api/challenge/progress");
      })
      .then((res) => {
        if (!res || !res.ok) return;
        return res.json();
      })
      .then((progJson) => {
        if (!active || !progJson) return;
        setDailyProgress(progJson);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to generate challenges client-side:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initiallyEmpty, propChallenges, propProgress, propDailyProgress]);

  // Fetch all challenges when switching to week/all filter
  React.useEffect(() => {
    if (statusFilter === "today") return;
    if (allChallenges.length > 0) return; // already fetched

    setLoadingAll(true);
    fetch("/api/challenge/history?limit=100")
      .then((res) => res.json())
      .then((json) => {
        setAllChallenges(json.items || []);
      })
      .catch((err) => console.warn("[challenge-list] fetch history failed:", err))
      .finally(() => setLoadingAll(false));
  }, [statusFilter, allChallenges.length]);

  const sourceChallenges =
    statusFilter === "today" ? challenges : allChallenges;

  const filtered = React.useMemo(() => {
    let result = sourceChallenges;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    if (statusFilter === "today") {
      result = result.filter((c) => c.scheduledFor.startsWith(todayStr));
    } else if (statusFilter === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      const mondayStr = monday.toISOString().split("T")[0];
      result = result.filter((c) => c.scheduledFor >= mondayStr);
    }

    return result;
  }, [sourceChallenges, statusFilter]);

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
      {/* UX-FIX: Show banner when user hasn't selected any subjects */}
      {!hasSubjects && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
              <Settings2 size={16} strokeWidth={2.2} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200">
                Kamu belum pilih mapel
              </p>
              <p className="text-[12px] leading-relaxed text-amber-700/80 dark:text-amber-300/70">
                Kamu belum daftarkan mapel untuk tantangan. Atur mapel harian
                dan mingguan di Pengaturan Tantangan di bawah, atau selesaikan
                onboarding untuk auto-set.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
              >
                <Link href="/settings">
                  <Settings2 size={13} />
                  Pilih Mapel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Atur Tantangan Card — moved to top (user request) */}
      <Reveal delay={15}>
        <section className="rounded-2xl border border-border/40 bg-card/80 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.05)] backdrop-blur-md sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)]/15 to-[var(--purple)]/15 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.15)]">
              <Settings2
                size={13}
                className="text-[var(--coral)]"
                strokeWidth={2.5}
              />
            </span>
            <p className="text-[12px] font-bold text-muted-foreground">
              Pengaturan Tantangan
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Daily Subject Setting */}
            <button
              type="button"
              onClick={() => setPickerOpen({ variant: "daily" })}
              className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 p-3.5 text-left transition-all hover:border-[var(--coral)]/30 hover:bg-[var(--coral)]/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--coral)]/10 text-[var(--coral)] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.2)]">
                <Target size={15} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold">Mapel Harian</p>
                <p className="text-[10.5px] text-muted-foreground">
                  {pickerSnapshot.daily.length > 0
                    ? `${pickerSnapshot.daily.length} mapel dipilih`
                    : "Belum dipilih"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className="text-muted-foreground rotate-[-90deg] group-hover:text-[var(--coral)]"
              />
            </button>

            {/* Weekly Subject Setting */}
            <button
              type="button"
              onClick={() => setPickerOpen({ variant: "weekly" })}
              className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 p-3.5 text-left transition-all hover:border-[var(--purple)]/30 hover:bg-[var(--purple)]/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--purple)]/10 text-[var(--purple)] shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)]">
                <Trophy size={15} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold">Mapel Mingguan</p>
                <p className="text-[10.5px] text-muted-foreground">
                  {pickerSnapshot.weekly.length > 0
                    ? `${pickerSnapshot.weekly.length} mapel dipilih`
                    : "Belum dipilih"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className="text-muted-foreground rotate-[-90deg] group-hover:text-[var(--purple)]"
              />
            </button>
          </div>
        </section>
      </Reveal>

      <Reveal delay={20}>
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
              value={
                loading ? "..." : `${progress.completed}/${progress.total}`
              }
              color="text-[var(--purple)]"
            />
            <StatTile
              icon={<Trophy size={14} />}
              label="XP"
              value={loading ? "..." : String(progress.points)}
              color="text-[var(--coral)]"
            />
            <StatTile
              icon={<Sparkles size={14} />}
              label="Overall"
              value={loading ? "..." : `${dailyProgress.overallScore}%`}
              color="text-[var(--teal)]"
            />
            <StatTile
              icon={<Target size={14} />}
              label="Mastery"
              value={loading ? "..." : `${dailyProgress.masteryScore}%`}
              color="text-amber-600"
            />
          </div>
        </header>
      </Reveal>

      {/* Weekly Challenge Card */}
      {!loading && weeklyChallenge && (
        <Reveal delay={40}>
          <WeeklyChallengeCard
            weeklyChallenge={weeklyChallenge}
            onClaimReward={claimWeeklyChallengeReward}
            onPickSubjects={() => setPickerOpen({ variant: "weekly" })}
            showSubjectPicker={true}
            subjectCount={pickerSnapshot.weekly.length}
          />
        </Reveal>
      )}

      {/* Daily Score Gauge */}
      {!loading && dailyProgress.overallScore > 0 && (
        <Reveal delay={60}>
          <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full opacity-20 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.7 0.15 220 / 0.5), transparent 70%)",
              }}
            />
            <div className="relative mb-3 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--blue)]/15 to-[var(--teal)]/15 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.2)]">
                <Sparkles
                  size={13}
                  className="text-[var(--blue)]"
                  strokeWidth={2.5}
                />
              </span>
              <p className="text-[11px] font-bold text-muted-foreground">
                Skor performa hari ini
              </p>
            </div>
            <DailyScoreGauge
              overallScore={dailyProgress.overallScore}
              challengeScore={dailyProgress.challengeScore}
              materialsScore={dailyProgress.materialsScore}
              reflectionsScore={dailyProgress.reflectionsScore}
              masteryScore={dailyProgress.masteryScore}
            />
          </section>
        </Reveal>
      )}

      {/* Single filter bar */}
      <Reveal delay={80}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 p-1 backdrop-blur-sm">
            {(["today", "week", "all"] as StatusFilter[]).map((f) => {
              const isActive = statusFilter === f;
              const label =
                f === "today"
                  ? "Hari ini"
                  : f === "week"
                    ? "Minggu ini"
                    : "Semua";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[12px] font-bold transition-all",
                    isActive
                      ? "bg-[var(--purple)] text-white shadow-[0_4px_10px_rgba(168,85,247,0.25)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <OnDemandGenerator
            onGenerate={handleGenerate}
            subjectOptions={subjectOptions}
          />
        </div>
      </Reveal>

      {loading ? (
        <Reveal delay={140}>
          <div className="rounded-3xl border border-border/40 bg-card/80 p-12 text-center shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md">
            <div className="relative flex size-12 mx-auto items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)]/20 opacity-75" />
              <span className="absolute inline-flex h-8 w-8 animate-spin rounded-full border-2 border-[var(--coral)] border-t-transparent" />
            </div>
            <p className="mt-5 font-heading text-[16px] font-bold">
              Menyiapkan Tantangan Harian Kamu...
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Spark sedang merancang tantangan belajar khusus untuk hari ini.
            </p>
          </div>
        </Reveal>
      ) : filtered.length === 0 ? (
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
            ) : (
              <>
                <p className="mt-3 font-heading text-[16px] font-bold">
                  Belum ada tantangan
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  {statusFilter === "today"
                    ? "AI lagi nyiapin tantangan pertamamu. Coba refresh dalam beberapa detik."
                    : "Coba ganti filter atau minta tantangan tambahan."}
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

      {pickerOpen && (
        <ChallengeSubjectPicker
          open={true}
          onClose={() => {
            setPickerOpen(null);
            router.refresh();
          }}
          variant={pickerOpen.variant}
          currentSubjectIds={
            pickerOpen.variant === "daily"
              ? pickerSnapshot.daily
              : pickerSnapshot.weekly
          }
          availableSubjects={availableSubjects}
        />
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
