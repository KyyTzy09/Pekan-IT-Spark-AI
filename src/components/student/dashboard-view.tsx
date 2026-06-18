import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Flame,
  MessageCircle,
  Play,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { SparkCharacter } from "@/components/student/spark-character";

const WeeklyActivityChart = dynamic(
  () =>
    import("@/components/student/weekly-activity-chart").then(
      (m) => m.WeeklyActivityChart,
    ),
  { ssr: false },
);

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  DashboardRecommendation,
  DashboardSummary,
} from "@/server/actions/dashboard";

type TimelinePoint = {
  date: string;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
};

export function DashboardView({
  summary,
  weeklyTimeline,
}: {
  summary: DashboardSummary;
  weeklyTimeline?: TimelinePoint[];
}) {
  return (
    <div className="space-y-5 sm:space-y-7">
      <HeroGreeting summary={summary} />
      <StatsRow summary={summary} />

      {/* Weekly Activity Chart */}
      {weeklyTimeline && weeklyTimeline.length > 0 && (
        <Reveal delay={60}>
          <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-xl sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 size-44 rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
              }}
            />
            <header className="relative mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--coral)]/15 to-[var(--orange)]/15 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.2)]">
                  <TrendingUp
                    size={16}
                    className="text-[var(--coral)]"
                    strokeWidth={2.5}
                  />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                    Aktivitas 7 hari
                  </p>
                  <h2 className="font-heading text-[16px] font-bold leading-tight text-foreground sm:text-[18px]">
                    Tren belajar kamu
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[9.5px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--coral)]" />
                  <span className="text-muted-foreground">Keseluruhan</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--teal)]" />
                  <span className="text-muted-foreground">Tantangan</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--purple)]" />
                  <span className="text-muted-foreground">Penguasaan</span>
                </span>
              </div>
            </header>
            <WeeklyActivityChart points={weeklyTimeline} />
          </section>
        </Reveal>
      )}

      <Reveal>
        <ContinueLearningCard
          recommendation={summary.recommendation}
          recentDocuments={summary.recentDocuments}
        />
      </Reveal>
    </div>
  );
}

function HeroGreeting({ summary }: { summary: DashboardSummary }) {
  const firstName = summary.student.name?.split(" ")[0] ?? "Teman";
  return (
    <Reveal>
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl backdrop-saturate-150 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.18 25 / 0.6), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 175 / 0.5), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4">
            <SparkCharacter size="md" />
            <div className="sm:hidden">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--coral)]">
                Hai, {firstName}!
              </p>
              <h1 className="mt-0.5 font-heading text-[22px] font-bold leading-tight text-foreground">
                {summary.greeting}
              </h1>
            </div>
          </div>
          <div className="hidden flex-1 sm:block">
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--coral)]">
              Hai, {firstName}!
            </p>
            <h1 className="mt-1 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-[30px]">
              {summary.greeting}
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {summary.greetingSubtitle}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 self-start sm:self-center">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[var(--coral)] px-4 text-[12.5px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
            >
              <Link href="/chat">
                <MessageCircle size={14} strokeWidth={2.5} />
                Tanya Spark
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-border/50 bg-background/60 px-3.5 text-[12.5px] font-semibold backdrop-blur-sm"
            >
              <Link href="/practice">
                <Play size={13} strokeWidth={2.5} />
                Latihan
              </Link>
            </Button>
          </div>
          <p className="-mt-1 text-[13px] leading-relaxed text-muted-foreground sm:hidden">
            {summary.greetingSubtitle}
          </p>
        </div>

        <div className="relative mt-5 flex items-start gap-2.5 rounded-2xl border border-border/40 bg-background/40 px-3.5 py-2.5 backdrop-blur-sm sm:mt-6">
          <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
            <Brain size={13} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
              Tips Spark
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground/85">
              {summary.sparkTip}
            </p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function StatsRow({ summary }: { summary: DashboardSummary }) {
  return (
    <Reveal delay={80} className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <StreakCard
        current={summary.streak.current}
        longest={summary.streak.longest}
        freezeAvailable={summary.streak.freezeAvailable}
      />
      <LevelCard
        level={summary.level.level}
        name={summary.level.name}
        progress={summary.level.progress}
        totalXp={summary.level.totalXp}
        xpToNext={summary.level.xpToNext}
        nextMinXp={summary.level.nextMinXp}
      />
      <MasteryCard
        mastered={summary.totalMastered}
        total={summary.totalConcepts}
        attempts={summary.totalAttempts}
        subjects={summary.subjects.length}
      />
    </Reveal>
  );
}

function StreakCard({
  current,
  longest,
  freezeAvailable,
}: {
  current: number;
  longest: number;
  freezeAvailable: number;
}) {
  const isActive = current > 0;
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl p-4 text-white shadow-[0_8px_24px_rgba(225,29,72,0.25)] transition-transform hover:-translate-y-0.5 sm:p-5",
        isActive
          ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)]"
          : "bg-gradient-to-br from-[var(--coral)]/80 to-[var(--orange)]/80",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/20 opacity-50 blur-2xl"
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
          <Flame
            size={18}
            strokeWidth={2.5}
            className={cn(
              "drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]",
              isActive && "anim-pulse-soft",
            )}
          />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-widest text-white/80">
          Streak
        </span>
      </div>
      <p className="relative mt-2 font-heading text-[34px] font-bold leading-none tracking-tight">
        {current}
        <span className="ml-1 text-[12px] font-semibold text-white/80">
          hari
        </span>
      </p>
      <p className="relative mt-0.5 text-[11px] font-semibold text-white/85">
        {isActive
          ? `${longest} hari rekor kamu 🔥`
          : "Belajar hari ini, mulai streak baru ✨"}
      </p>
      <div className="relative mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-white/85">
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5">
          ❄️ {freezeAvailable} freeze
        </span>
      </div>
    </article>
  );
}

function LevelCard({
  level,
  name,
  progress,
  totalXp,
  xpToNext,
  nextMinXp,
}: {
  level: number;
  name: string;
  progress: number;
  totalXp: number;
  xpToNext: number | null;
  nextMinXp: number | null;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full bg-[var(--yellow)]/20 opacity-50 blur-2xl"
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--yellow)]/20 to-[var(--orange)]/20 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]">
          <Zap
            size={17}
            className="text-[var(--yellow)] drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
            strokeWidth={2.5}
          />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
          Level
        </span>
      </div>
      <p className="relative mt-2 font-heading text-[20px] font-bold leading-tight text-foreground">
        {name}{" "}
        <span className="text-[12px] font-semibold text-muted-foreground">
          #{level}
        </span>
      </p>
      <p className="relative mb-2 text-[11px] font-semibold text-muted-foreground">
        <span className="tabular-nums text-foreground">
          {totalXp.toLocaleString("id-ID")}
        </span>
        {nextMinXp !== null && <> / {nextMinXp.toLocaleString("id-ID")} XP</>}
      </p>
      <Progress value={progress} className="relative h-2 bg-muted/80" />
      <p className="relative mt-1.5 text-[10px] font-bold text-muted-foreground">
        {xpToNext !== null ? (
          <>
            <span className="text-[var(--coral)]">
              {xpToNext.toLocaleString("id-ID")} XP
            </span>{" "}
            lagi ke level berikutnya
          </>
        ) : (
          <span className="text-[var(--coral)]">Max level! 🎉</span>
        )}
      </p>
    </article>
  );
}

function MasteryCard({
  mastered,
  total,
  attempts,
  subjects,
}: {
  mastered: number;
  total: number;
  attempts: number;
  subjects: number;
}) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[var(--purple)]/20 opacity-50 blur-2xl"
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-[var(--pink)]/20 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]">
          <Star
            size={16}
            className="text-[var(--purple)] drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
            strokeWidth={2.5}
            fill="currentColor"
          />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
          Konsep
        </span>
      </div>
      <p className="relative mt-2 font-heading text-[20px] font-bold leading-tight text-foreground">
        {mastered}
        <span className="text-[12px] font-semibold text-muted-foreground">
          {" "}
          / {total} dikuasai
        </span>
      </p>
      <p className="relative mb-2 text-[11px] font-semibold text-muted-foreground">
        {subjects > 0
          ? `${subjects} mata pelajaran aktif · ${attempts} soal dijawab`
          : "Belum ada mapel yang dipilih"}
      </p>
      <Progress value={pct} className="relative h-2 bg-muted/80" />
      <p className="relative mt-1.5 text-[10px] font-bold text-muted-foreground">
        <span className="text-[var(--purple)]">{pct}%</span> konstelasi menyala
      </p>
    </article>
  );
}

function ContinueLearningCard({
  recommendation,
  recentDocuments,
}: {
  recommendation: DashboardRecommendation | null;
  recentDocuments: number;
}) {
  if (!recommendation) {
    return (
      <article className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_6px_18px_rgba(14,165,233,0.35)]">
            <BookOpen size={20} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">
              Mulai petualangan
            </p>
            <h2 className="mt-1 font-heading text-[18px] font-bold text-foreground">
              Belum ada konsep yang dimulai
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Pilih mata pelajaran di sebelah, atau upload materi guru biar
              Spark bantu rangkum jadi latihan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
              >
                <Link href="/subjects">
                  Jelajah mapel
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/upload">
                  <BookOpen size={13} />
                  Upload materi
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const statusLabel: Record<DashboardRecommendation["status"], string> = {
    NOT_STARTED: "Belum mulai",
    LEARNING: "Lagi dipelajari",
    MASTERED: "Sudah dikuasai",
    STRUGGLING: "Butuh bantuan",
  };
  const statusColor: Record<DashboardRecommendation["status"], string> = {
    NOT_STARTED: "from-[var(--blue)] to-[var(--teal)]",
    LEARNING: "from-[var(--yellow)] to-[var(--orange)]",
    MASTERED: "from-[var(--teal)] to-[var(--green)]",
    STRUGGLING: "from-[var(--coral)] to-[var(--pink)]",
  };
  const masteryPct = Math.round(recommendation.masteryScore * 100);

  return (
    <article className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-30 blur-3xl"
        style={{
          background: recommendation.subjectColor
            ? `linear-gradient(135deg, ${recommendation.subjectColor}, transparent)`
            : "linear-gradient(135deg, var(--coral), transparent)",
        }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Lanjutkan
          </span>
          <span
            className={cn(
              "rounded-full bg-gradient-to-r px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-white",
              statusColor[recommendation.status],
            )}
          >
            {statusLabel[recommendation.status]}
          </span>
        </div>
        <span className="text-[10.5px] font-semibold text-muted-foreground">
          {recommendation.subjectName}
        </span>
      </div>
      <h2 className="relative mt-2 font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {recommendation.conceptName}
      </h2>
      <p className="relative mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {recommendation.reason}
      </p>

      <div className="relative mt-4 flex items-center gap-4">
        <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)]/12 to-[var(--orange)]/12 text-foreground shadow-[inset_0_0_0_1px_rgba(225,29,72,0.18)]">
          <svg
            viewBox="0 0 36 36"
            className="absolute inset-1 size-12 -rotate-90"
            role="img"
            aria-label={`Pemahaman ${masteryPct}%`}
          >
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--coral)"
              strokeWidth="3"
              strokeDasharray={`${(masteryPct / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <span className="relative font-heading text-[12.5px] font-bold text-[var(--coral)]">
            {masteryPct}%
          </span>
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Pemahaman saat ini
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold text-foreground/85">
            {recommendation.type === "continue"
              ? "Tuntaskan biar jadi MASTERED ✨"
              : "Mulai dengan 5 soal pemanasan"}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <Button
          asChild
          size="sm"
          className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
        >
          <Link href={`/practice?topicId=${recommendation.topicId}`}>
            <Play size={13} strokeWidth={2.5} />
            Mulai 5 soal
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/subjects/${recommendation.subjectSlug}`}>
            Lihat topik
            <ArrowUpRight size={13} />
          </Link>
        </Button>
        {recentDocuments > 0 && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-[var(--teal)]"
          >
            <Link href="/upload">
              {recentDocuments} materi terupload
              <ArrowUpRight size={13} />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
