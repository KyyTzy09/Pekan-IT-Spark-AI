"use client";

import {
  BookOpen,
  Calendar,
  Check,
  CircleDashed,
  Clock,
  Coffee,
  Loader2,
  MessageCircle,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  markActivityComplete,
  markActivityIncomplete,
  regenerateCurrentPlan,
} from "@/server/actions/learning-plan";
import type { PlanActivity, WeeklyPlan } from "@/server/learning-plan";

const ACTIVITY_ICON: Record<
  PlanActivity["type"],
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  review: RefreshCw,
  practice: Target,
  explore: BookOpen,
  quiz: TrendingUp,
  chat: MessageCircle,
  rest: Coffee,
};

const ACTIVITY_LABEL: Record<PlanActivity["type"], string> = {
  review: "Review",
  practice: "Latihan",
  explore: "Eksplorasi",
  quiz: "Quiz",
  chat: "Chat",
  rest: "Libur",
};

const ACTIVITY_ACCENT: Record<PlanActivity["type"], string> = {
  review: "from-[var(--coral)] to-[var(--orange)]",
  practice: "from-[var(--purple)] to-[var(--pink)]",
  explore: "from-[var(--teal)] to-[var(--blue)]",
  quiz: "from-[var(--yellow)] to-[var(--orange)]",
  chat: "from-[var(--blue)] to-[var(--teal)]",
  rest: "from-[var(--muted)] to-[var(--muted-foreground)]/30",
};

export function LearningPlanView({
  initialPlan,
}: {
  initialPlan: WeeklyPlan | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<WeeklyPlan | null>(initialPlan);
  const [loading, setLoading] = React.useState(!initialPlan);
  const [regenerating, setRegenerating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch("/api/plan")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch plan");
        return res.json();
      })
      .then((json) => {
        if (active) {
          setPlan(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load plan client-side:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialPlan]);

  const onToggle = async (activity: PlanActivity) => {
    setPendingId(activity.id);
    try {
      if (activity.completed) {
        const next = await markActivityIncomplete(activity.id);
        if (next) setPlan(next);
      } else {
        const next = await markActivityComplete(activity.id);
        if (next) setPlan(next);
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const onRegenerate = async () => {
    if (
      !window.confirm(
        "Regenerate rencana belajar? Progress yang udah kamu tandai selesai bakal di-reset.",
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      const next = await regenerateCurrentPlan();
      setPlan(next);
      router.refresh();
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || !plan) {
    const weekSkeletons = [
      "week-0",
      "week-1",
      "week-2",
      "week-3",
      "week-4",
      "week-5",
      "week-6",
    ];
    const todaySkeletons = ["today-0", "today-1", "today-2"];

    return (
      <div className="space-y-5 sm:space-y-7 animate-pulse">
        {/* Skeleton for PlanHero */}
        <div className="rounded-3xl border border-border/40 bg-card/40 p-5 sm:p-7 h-[220px]" />

        {/* Skeleton for WeekGrid */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="grid grid-cols-7 gap-2">
            {weekSkeletons.map((key) => (
              <div key={key} className="h-20 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Skeleton for TodaySection */}
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="space-y-2">
            {todaySkeletons.map((key) => (
              <div key={key} className="h-24 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayIndex = plan.days.findIndex((d) => d.date === today);
  const safeTodayIndex = todayIndex >= 0 ? todayIndex : 0;
  const todayDay = plan.days[safeTodayIndex];

  const { summary } = plan;
  const completionPct =
    summary.totalActivities > 0
      ? Math.round(
          (summary.completedActivities / summary.totalActivities) * 100,
        )
      : 0;

  return (
    <div className="space-y-5 sm:space-y-7">
      <PlanHero
        weekStart={plan.weekStart}
        weekEnd={plan.weekEnd}
        summary={summary}
        completionPct={completionPct}
        regenerating={regenerating}
        onRegenerate={onRegenerate}
      />

      <WeekGrid days={plan.days} todayIndex={safeTodayIndex} />

      {todayDay && (
        <TodaySection
          day={todayDay}
          pendingId={pendingId}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

function PlanHero({
  weekStart,
  weekEnd,
  summary,
  completionPct,
  regenerating,
  onRegenerate,
}: {
  weekStart: string;
  weekEnd: string;
  summary: WeeklyPlan["summary"];
  completionPct: number;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 size-36 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
            <Calendar size={10} strokeWidth={2.5} />
            Rencana Mingguan
            {formatDateRange(weekStart, weekEnd)}
          </span>
          <h1 className="mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
            <span className="text-gradient-warm">Belajar adaptif</span> minggu
            ini
          </h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
            Spark nge-generate rencana berdasarkan konsep yang lagi kamu
            struggle dan yang lagi dipelajari. Selesaikan, atau regenerate kalo
            mau mulai ulang.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={regenerating}
          className="rounded-full"
        >
          {regenerating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Regenerate...
            </>
          ) : (
            <>
              <RefreshCw size={13} />
              Regenerate
            </>
          )}
        </Button>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HeroStat
          label="Aktivitas selesai"
          value={`${summary.completedActivities} / ${summary.totalActivities}`}
          accent="from-[var(--coral)] to-[var(--orange)]"
        />
        <HeroStat
          label="Estimasi"
          value={`${summary.estimatedMinutes} mnt`}
          accent="from-[var(--blue)] to-[var(--teal)]"
        />
        <HeroStat
          label="XP earned"
          value={`${summary.earnedXp} / ${summary.totalXp}`}
          accent="from-[var(--yellow)] to-[var(--orange)]"
        />
        <HeroStat
          label="Fokus minggu"
          value={summary.focusAreas[0] ?? "—"}
          accent="from-[var(--purple)] to-[var(--pink)]"
        />
      </div>

      <div className="relative mt-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
          <span className="text-muted-foreground">Progress minggu ini</span>
          <span className="text-[var(--coral)]">{completionPct}%</span>
        </div>
        <Progress value={completionPct} className="mt-2 h-2 bg-muted/80" />
      </div>
    </header>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-3 backdrop-blur-sm">
      <div
        className={cn("mb-1 h-1 w-10 rounded-full bg-gradient-to-r", accent)}
      />
      <p className="font-heading text-[18px] font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function WeekGrid({
  days,
  todayIndex,
}: {
  days: WeeklyPlan["days"];
  todayIndex: number;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
            Peta minggu
          </p>
          <h2 className="mt-1 font-heading text-[18px] font-bold leading-tight text-foreground">
            7 hari ke depan
          </h2>
        </div>
        <span className="text-[10.5px] font-semibold text-muted-foreground">
          Tap hari buat liat detail
        </span>
      </header>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, i) => {
          const isToday = i === todayIndex;
          const isPast = i < todayIndex;
          const completed = day.activities.filter((a) => a.completed).length;
          const total = day.activities.filter((a) => a.type !== "rest").length;
          return (
            <div
              key={day.date}
              className={cn(
                "group/day relative overflow-hidden rounded-2xl border p-2 text-center transition-all sm:p-3",
                isToday
                  ? "border-transparent bg-[var(--coral)]/8 ring-2 ring-[var(--coral)]/40"
                  : isPast
                    ? "border-border/40 bg-card/60"
                    : "border-border/40 bg-card/70",
              )}
            >
              <p
                className={cn(
                  "text-[9.5px] font-bold uppercase tracking-widest sm:text-[10px]",
                  isToday
                    ? "text-[var(--coral)]"
                    : isPast
                      ? "text-[var(--teal)]"
                      : "text-muted-foreground/70",
                )}
              >
                {day.shortDayName}
              </p>
              <p className="mt-0.5 font-heading text-[15px] font-bold text-foreground sm:text-[17px]">
                {day.date.slice(8, 10)}
              </p>
              <div className="mt-1.5 flex justify-center gap-0.5">
                {day.activities.map((a) => {
                  if (a.type === "rest") {
                    return (
                      <span
                        key={a.id}
                        className="size-1.5 rounded-full bg-muted-foreground/30"
                        title="Libur"
                      />
                    );
                  }
                  return (
                    <span
                      key={a.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        a.completed
                          ? "bg-[var(--teal)]"
                          : "bg-muted-foreground/30",
                      )}
                    />
                  );
                })}
              </div>
              {total > 0 && (
                <p className="mt-1 text-[9px] font-bold text-muted-foreground sm:text-[10px]">
                  {completed}/{total}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TodaySection({
  day,
  pendingId,
  onToggle,
}: {
  day: WeeklyPlan["days"][number];
  pendingId: string | null;
  onToggle: (a: PlanActivity) => void;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
            Hari ini
          </p>
          <h2 className="mt-1 font-heading text-[18px] font-bold leading-tight text-foreground">
            {day.dayName}, {formatLongDate(day.date)}
          </h2>
        </div>
        <span className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-[10.5px] font-bold text-foreground/80">
          {day.activities.filter((a) => a.completed).length} /{" "}
          {day.activities.length} selesai
        </span>
      </header>
      <div className="space-y-2.5">
        {day.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            pending={pendingId === activity.id}
            onToggle={() => onToggle(activity)}
          />
        ))}
      </div>
    </section>
  );
}

function ActivityCard({
  activity,
  pending,
  onToggle,
}: {
  activity: PlanActivity;
  pending: boolean;
  onToggle: () => void;
}) {
  const Icon = ACTIVITY_ICON[activity.type];
  const isRest = activity.type === "rest";
  const accent = ACTIVITY_ACCENT[activity.type];

  if (isRest) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card/40 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Coffee size={16} strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-heading text-[14px] font-bold text-foreground">
            {activity.title}
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            {activity.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "group/act relative overflow-hidden rounded-2xl border p-4 transition-all",
        activity.completed
          ? "border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_8%,transparent)]"
          : "border-border/40 bg-card/70 hover:border-border/70",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover/act:opacity-40"
        style={{
          background: activity.subjectColor
            ? `linear-gradient(135deg, ${activity.subjectColor}, transparent)`
            : "linear-gradient(135deg, var(--coral), transparent)",
        }}
      />
      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            accent,
          )}
        >
          <Icon size={16} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-foreground/5 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-foreground/70">
                  {ACTIVITY_LABEL[activity.type]}
                </span>
                {activity.subjectName && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      background: activity.subjectColor
                        ? `color-mix(in oklch, ${activity.subjectColor} 15%, transparent)`
                        : "var(--muted)",
                      color: activity.subjectColor ?? "var(--foreground)",
                    }}
                  >
                    {activity.subjectName}
                  </span>
                )}
                {activity.conceptStatus === "STRUGGLING" && (
                  <span className="rounded-full bg-[var(--coral)]/10 px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--coral)]">
                    Struggle
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1.5 font-heading text-[14px] font-bold leading-snug",
                  activity.completed
                    ? "text-foreground/70 line-through"
                    : "text-foreground",
                )}
              >
                {activity.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                {activity.description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10.5px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {activity.estimatedMinutes} mnt
                </span>
                <span className="flex items-center gap-1 text-[var(--yellow)]">
                  <Zap size={10} />+{activity.xpReward} XP
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              disabled={pending}
              aria-label={
                activity.completed ? "Tandai belum selesai" : "Tandai selesai"
              }
              className={cn(
                "group/btn grid size-9 shrink-0 place-items-center rounded-full transition-all",
                activity.completed
                  ? "bg-[var(--teal)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
                  : "border-2 border-muted-foreground/30 bg-background/40 text-muted-foreground hover:border-[var(--coral)] hover:text-[var(--coral)]",
                pending && "opacity-60",
              )}
            >
              {pending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : activity.completed ? (
                <Check size={15} strokeWidth={3} />
              ) : (
                <CircleDashed size={14} className="group-hover/btn:scale-110" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth();
  if (sameMonth) {
    return ` · ${s.getDate()}–${e.getDate()} ${formatMonth(s)}`;
  }
  return ` · ${s.getDate()} ${formatMonth(s)} – ${e.getDate()} ${formatMonth(e)}`;
}

function formatMonth(d: Date): string {
  return d.toLocaleString("id-ID", { month: "short" });
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
