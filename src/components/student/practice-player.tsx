"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  Flame,
  Lightbulb,
  Loader2,
  Lock,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startNewChat } from "@/server/actions/chat";
import {
  getNextPracticeQuestion,
  getPracticeStats,
  getQuestionHint,
  type PracticeSession,
  type PracticeStats,
  type SubmitPracticeResult,
  submitPracticeAnswer,
} from "@/server/actions/practice";
import { useBadgeCelebration } from "@/components/student/badge-unlock-provider";

const DIFFICULTY_META: Record<
  string,
  { label: string; color: string; ring: string; chip: string; emoji: string }
> = {
  EASY: {
    label: "Mudah",
    color: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-300/60",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    emoji: "🌱",
  },
  MEDIUM: {
    label: "Sedang",
    color: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-300/60",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    emoji: "⚡",
  },
  HARD: {
    label: "Sulit",
    color: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-300/60",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    emoji: "🔥",
  },
  ADVANCED: {
    label: "Tantangan",
    color: "text-fuchsia-700 dark:text-fuchsia-300",
    ring: "ring-fuchsia-300/60",
    chip: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    emoji: "🧠",
  },
};

const STATUS_META: Record<
  string,
  {
    label: string;
    chip: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  NOT_STARTED: {
    label: "Belum mulai",
    chip: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    icon: CircleDashed,
  },
  LEARNING: {
    label: "Sedang dipelajari",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    icon: TrendingUp,
  },
  STRUGGLING: {
    label: "Butuh bantuan",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    icon: Target,
  },
  MASTERED: {
    label: "Mastered ✨",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    icon: CheckCircle2,
  },
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function PracticePlayer({
  initialSession,
  initialStats,
  subjectSlug,
  topicId,
}: {
  initialSession: PracticeSession;
  initialStats: PracticeStats;
  subjectSlug?: string;
  topicId?: string;
}) {
  const router = useRouter();
  const { showBadges } = useBadgeCelebration();
  const [session, setSession] = React.useState<PracticeSession>(initialSession);
  const [stats, setStats] = React.useState<PracticeStats>(initialStats);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SubmitPracticeResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingNext, setLoadingNext] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [hintRevealed, setHintRevealed] = React.useState(false);
  const [hintText, setHintText] = React.useState<string | null>(null);
  const [hintLoading, setHintLoading] = React.useState(false);
  const [socraticLoading, setSocraticLoading] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(false);
  const startedAt = React.useRef<number>(Date.now());

  React.useEffect(() => {
    startedAt.current = Date.now();
    setElapsedMs(0);
    setSelected(null);
    setResult(null);
    setShowCelebration(false);
    setHintRevealed(false);
    setHintText(null);
    setShowWhy(false);
  }, [session.question.id]);

  React.useEffect(() => {
    if (result) return;
    const t = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current);
    }, 500);
    return () => window.clearInterval(t);
  }, [result]);

  const onSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitPracticeAnswer({
        questionId: session.question.id,
        answer: selected,
        timeSpent: Math.round(elapsedMs / 1000),
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult(r);
      if (r.masteredNow) {
        setShowCelebration(true);
      }
      if (r.unlockedBadges?.length) {
        showBadges(r.unlockedBadges);
      }
      const newStats = await getPracticeStats();
      if (newStats) setStats(newStats);
    } finally {
      setSubmitting(false);
    }
  };

  const onRevealHint = async () => {
    if (hintRevealed || hintLoading) return;
    setHintLoading(true);
    try {
      const r = await getQuestionHint({ questionId: session.question.id });
      if (r.ok) setHintText(r.hint);
    } finally {
      setHintLoading(false);
      setHintRevealed(true);
    }
  };

  const onSocraticChat = async () => {
    if (socraticLoading) return;
    setSocraticLoading(true);
    try {
      const q = session.question;
      const firstMessage = `Aku lagi latihan soal ini di topik ${q.topicName} (${q.subjectName}):\n\n"${q.questionText}"\n\nBoleh bantu aku pecah lewat pertanyaan? Aku belum ngerti konsep "${q.conceptName}".`;
      const res = await startNewChat({ firstMessage });
      router.push(`/chat/${res.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mulai chat.");
      setSocraticLoading(false);
    }
  };

  const onNext = async () => {
    setLoadingNext(true);
    setError(null);
    try {
      const next = await getNextPracticeQuestion({
        subjectSlug,
        topicId,
      });
      if (!next.ok) {
        setError(next.error);
        return;
      }
      setSession(next.session);
    } finally {
      setLoadingNext(false);
    }
  };

  const isAnswered = result?.ok === true;
  const diffMeta =
    DIFFICULTY_META[session.currentDifficulty] ?? DIFFICULTY_META.EASY;
  const correctIndex = result?.ok ? letterToIndex(result.correctAnswer) : -1;
  const elapsedSec = Math.max(1, Math.round(elapsedMs / 1000));

  return (
    <div className="space-y-5 sm:space-y-7">
      <SessionHeader
        accuracyPct={session.accuracyPct}
        recentTotal={session.recentTotal}
        difficulty={session.currentDifficulty}
        diffMeta={diffMeta}
        stats={stats}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={session.question.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full opacity-30 blur-3xl"
            style={{
              background: `radial-gradient(circle, oklch(0.72 0.18 ${difficultyHue(session.currentDifficulty)} / 0.5), transparent 70%)`,
            }}
          />
          <div className="relative flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                diffMeta.chip,
              )}
            >
              <span aria-hidden>{diffMeta.emoji}</span>
              Difficulty: {diffMeta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-muted-foreground">
              <Target size={10} strokeWidth={2.5} />
              Akurasi: {session.accuracyPct}% ({session.recentTotal} soal)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-muted-foreground">
              <Timer size={10} strokeWidth={2.5} />
              {elapsedSec}s
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-muted-foreground">
              {session.question.subjectName} · {session.question.topicName}
            </span>
          </div>

          <h2 className="relative mt-4 font-heading text-[18px] font-bold leading-snug sm:text-[20px]">
            {session.question.questionText}
          </h2>

          <ul className="relative mt-5 grid gap-2.5">
            {session.question.options.map((opt, i) => {
              const letter = LETTERS[i] ?? String(i);
              const isSelected = selected === letter;
              const isCorrect = isAnswered && i === correctIndex;
              const isWrongPick =
                isAnswered && isSelected && i !== correctIndex;
              return (
                <li key={`${session.question.id}-${letter}`}>
                  <button
                    type="button"
                    disabled={isAnswered || submitting}
                    onClick={() => setSelected(letter)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all",
                      "border-border/40 bg-background/60 hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/5",
                      isSelected &&
                        !isAnswered &&
                        "border-[var(--coral)] bg-[var(--coral)]/8 ring-2 ring-[var(--coral)]/30",
                      isCorrect &&
                        "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/40 dark:bg-emerald-500/10",
                      isWrongPick &&
                        "border-rose-400 bg-rose-50 ring-2 ring-rose-300/40 dark:bg-rose-500/10",
                      isAnswered && !isSelected && !isCorrect && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                        "bg-muted text-muted-foreground",
                        isSelected &&
                          !isAnswered &&
                          "bg-[var(--coral)] text-white",
                        isCorrect && "bg-emerald-500 text-white",
                        isWrongPick && "bg-rose-500 text-white",
                      )}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 text-[13.5px] leading-relaxed sm:text-[14px]">
                      {opt}
                    </span>
                    {isCorrect && (
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 text-emerald-600"
                      />
                    )}
                    {isWrongPick && (
                      <XCircle size={16} className="mt-0.5 text-rose-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {!isAnswered ? (
            <div className="relative mt-5 flex flex-wrap items-center gap-2">
              <Button
                onClick={onSubmit}
                disabled={!selected || submitting}
                className="rounded-full bg-[var(--coral)] px-5 text-white shadow-[0_8px_22px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Memeriksa…
                  </>
                ) : (
                  <>
                    Kirim jawaban
                    <ArrowRight size={14} className="ml-1.5" />
                  </>
                )}
              </Button>
              {!isAnswered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRevealHint}
                  disabled={hintRevealed || hintLoading}
                  className="rounded-full"
                >
                  {hintLoading ? (
                    <>
                      <Loader2 size={12} className="mr-1 animate-spin" />
                      Nyiapin hint…
                    </>
                  ) : hintRevealed ? (
                    <>
                      <Lightbulb
                        size={12}
                        className="mr-1 text-[var(--yellow)]"
                      />
                      Hint udah dibuka
                    </>
                  ) : (
                    <>
                      <Lightbulb size={12} className="mr-1" />
                      Minta hint
                    </>
                  )}
                </Button>
              )}
              {error && (
                <p className="text-[12px] font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <FeedbackPanel result={result} session={session} />
          )}

          {!isAnswered && (hintText || session.socraticHint) && (
            <div className="relative mt-3 space-y-2">
              {hintText && (
                <div className="rounded-2xl border border-[var(--yellow)]/30 bg-[var(--yellow)]/8 p-3 text-[12.5px] leading-relaxed text-foreground/85">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--yellow)]">
                    <Lightbulb size={12} />
                    Hint
                  </div>
                  <p className="mt-1 whitespace-pre-line">{hintText}</p>
                </div>
              )}
              {!hintText && session.socraticHint && (
                <div className="rounded-2xl border border-border/40 bg-background/40 p-3 text-[12px] leading-relaxed text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
                    <Sparkles size={11} className="text-[var(--purple)]" />
                    Socratic nudge
                  </div>
                  <p className="mt-1">{session.socraticHint}</p>
                </div>
              )}
            </div>
          )}

          {isAnswered && result?.ok && !result.isCorrect && (
            <div className="relative mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSocraticChat}
                disabled={socraticLoading}
                className="rounded-full"
              >
                {socraticLoading ? (
                  <>
                    <Loader2 size={12} className="mr-1 animate-spin" />
                    Nyiapin chat…
                  </>
                ) : (
                  <>
                    <MessageCircle size={12} className="mr-1" />
                    Diskusiin sama Spark (Socratic)
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWhy(true)}
                className="rounded-full"
              >
                <CircleHelp size={12} className="mr-1" />
                Kenapa?
              </Button>
            </div>
          )}

          {isAnswered && result?.ok && result.isCorrect && (
            <div className="relative mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWhy(true)}
                className="rounded-full"
              >
                <CircleHelp size={12} className="mr-1" />
                Kenapa jawabannya begitu?
              </Button>
            </div>
          )}

          {isAnswered && result?.ok && result.stuck.recommendedPrereq && (
            <div className="relative mt-3 rounded-2xl border border-amber-300/50 bg-amber-50/80 p-3 text-[12.5px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock size={12} />
                Streak salah {result.stuck.wrongStreak}x di "
                {session.question.conceptName}"
              </div>
              <p className="mt-1">
                Prasyarat <strong>{result.stuck.recommendedPrereq.name}</strong>{" "}
                masih lemah (
                {Math.round(result.stuck.recommendedPrereq.score * 100)}%). Yuk
                remedial di sana dulu — nanti konsep ini bakal kebuka otomatis.
              </p>
              <div className="mt-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full border-amber-300/60 px-2.5 text-[11px] text-amber-900 hover:bg-amber-100 dark:text-amber-200"
                >
                  <Link href={`/practice`}>
                    Remedial "{result.stuck.recommendedPrereq.name}"
                    <ArrowRight size={11} className="ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {isAnswered && (
            <div className="relative mt-5 flex flex-wrap items-center gap-2">
              <Button
                onClick={onNext}
                disabled={loadingNext}
                className="rounded-full bg-[var(--purple)] px-5 text-white shadow-[0_8px_22px_rgba(124,58,237,0.35)] hover:bg-[var(--purple)]/90"
              >
                {loadingNext ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Memuat…
                  </>
                ) : (
                  <>
                    Soal berikutnya
                    <ArrowRight size={14} className="ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {session.weakPrereqs.length > 0 && !isAnswered && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/70 p-4 text-[12.5px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-bold">
            <Lock size={13} />
            Prasyarat belum terpenuhi
          </div>
          <p className="mt-1">
            Beberapa konsep prasyarat masih lemah:{" "}
            {session.weakPrereqs.map((w, i) => (
              <span key={w.conceptId}>
                <strong>{w.name}</strong> ({Math.round(w.score * 100)}%)
                {i < session.weakPrereqs.length - 1 ? ", " : ""}
              </span>
            ))}
            . Selesaikan dulu supaya bisa unlock konsep turunannya.
          </p>
        </div>
      )}

      <WhyModal
        open={showWhy}
        onClose={() => setShowWhy(false)}
        result={result}
        question={session.question}
      />

      <MasteredCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        conceptName={session.question.conceptName}
        unlocked={result?.ok ? result.unlockedConcepts : []}
      />
    </div>
  );
}

function SessionHeader({
  accuracyPct,
  recentTotal,
  difficulty,
  diffMeta,
  stats,
}: {
  accuracyPct: number;
  recentTotal: number;
  difficulty: string;
  diffMeta: { label: string; chip: string; emoji: string };
  stats: PracticeStats;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Akurasi kamu
        </p>
        <p className="mt-1 font-heading text-[26px] font-bold leading-none">
          {accuracyPct}
          <span className="text-[14px] font-medium text-muted-foreground">
            %
          </span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {recentTotal === 0
            ? "Belum ada attempt"
            : `${recentTotal} soal terakhir`}
        </p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Difficulty
        </p>
        <p className="mt-1 font-heading text-[20px] font-bold leading-none">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]",
              diffMeta.chip,
            )}
          >
            <span aria-hidden>{diffMeta.emoji}</span>
            {diffMeta.label}
          </span>
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Recommended:{" "}
          <strong>
            {DIFFICULTY_META[stats.recommendedDifficulty]?.label ?? "Mudah"}
          </strong>
        </p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Streak & konsep
        </p>
        <p className="mt-1 font-heading text-[20px] font-bold leading-none">
          <Flame size={14} className="mr-1 inline text-rose-500" />
          {stats.longestStreak}
          <span className="ml-1 text-[12px] font-medium text-muted-foreground">
            best
          </span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Mastered: <strong>{stats.masteredCount}</strong> · Struggling:{" "}
          <strong>{stats.strugglingCount}</strong>
        </p>
      </div>
    </div>
  );
}

function FeedbackPanel({
  result,
  session,
}: {
  result: SubmitPracticeResult | null;
  session: PracticeSession;
}) {
  if (!result?.ok) {
    return (
      <div className="mt-5 rounded-2xl border border-rose-300/50 bg-rose-50/80 p-4 text-[13px] leading-relaxed text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
        Gagal menyimpan jawaban. Coba lagi ya.
      </div>
    );
  }
  const statusMeta = STATUS_META[result.newStatus] ?? STATUS_META.NOT_STARTED;
  const StatusIcon = statusMeta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mt-5 space-y-3 rounded-2xl border p-4 backdrop-blur",
        result.isCorrect
          ? "border-emerald-300/50 bg-emerald-50/80 dark:bg-emerald-500/10"
          : "border-rose-300/50 bg-rose-50/80 dark:bg-rose-500/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {result.isCorrect ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} /> Benar!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-rose-700 dark:text-rose-300">
            <XCircle size={14} /> Belum tepat
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          Jawaban benar:{" "}
          <strong className="text-foreground">{result.correctAnswer}</strong>
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            statusMeta.chip,
          )}
        >
          <StatusIcon size={11} />
          {statusMeta.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          <Sparkles size={10} />
          Mastery: {Math.round(result.newMastery * 100)}%
        </span>
      </div>
      {result.explanation && (
        <p className="text-[13px] leading-relaxed text-foreground/80">
          {result.explanation}
        </p>
      )}
      {!result.isCorrect && (
        <p className="text-[12px] text-foreground/70">
          Konsep: <strong>{session.question.conceptName}</strong>. Coba review
          dulu sebelum lanjut.
        </p>
      )}
      {result.masteredNow && (
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
          <PartyPopper size={14} />
          {session.question.conceptName} mastered! Konsep dependen baru terbuka.
        </div>
      )}
    </motion.div>
  );
}

function MasteredCelebration({
  open,
  onClose,
  conceptName,
  unlocked,
}: {
  open: boolean;
  onClose: () => void;
  conceptName: string;
  unlocked: Array<{ id: string; name: string }>;
}) {
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(t);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="pointer-events-auto fixed inset-x-0 bottom-6 z-50 mx-auto flex max-w-md flex-col items-center gap-2 rounded-3xl border border-emerald-300/50 bg-emerald-50/95 p-5 text-center shadow-2xl backdrop-blur-xl dark:bg-emerald-500/15"
          role="status"
        >
          <div className="text-3xl" aria-hidden>
            🎉
          </div>
          <p className="font-heading text-[18px] font-bold text-emerald-800 dark:text-emerald-200">
            {conceptName} mastered!
          </p>
          {unlocked.length > 0 ? (
            <p className="text-[12.5px] text-emerald-900/80 dark:text-emerald-100/80">
              Konsep baru terbuka: {unlocked.map((u) => u.name).join(", ")}
            </p>
          ) : (
            <p className="text-[12.5px] text-emerald-900/80 dark:text-emerald-100/80">
              Nice! Lanjut topik berikutnya yuk.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function letterToIndex(letter: string): number {
  if (!letter) return -1;
  const upper = letter.trim().toUpperCase();
  const idx = LETTERS.indexOf(upper);
  return idx >= 0 ? idx : Number.parseInt(upper, 10) - 1;
}

function difficultyHue(d: string): number {
  switch (d) {
    case "EASY":
      return 145;
    case "MEDIUM":
      return 70;
    case "HARD":
      return 25;
    case "ADVANCED":
      return 295;
    default:
      return 280;
  }
}

function WhyModal({
  open,
  onClose,
  result,
  question,
}: {
  open: boolean;
  onClose: () => void;
  result: SubmitPracticeResult | null;
  question: { questionText: string; conceptName: string; topicName: string };
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[var(--purple)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  <CircleHelp size={10} strokeWidth={2.5} />
                  Kenapa?
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {question.conceptName}{" "}
                  <span className="text-muted-foreground">
                    · {question.topicName}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-background/60 text-muted-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative max-h-[70vh] overflow-y-auto p-5 text-[13px] leading-relaxed">
              {result?.ok && result.isCorrect && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 size={11} />
                  Benar — jawaban kamu "{result.correctAnswer}"
                </div>
              )}
              {result?.ok && !result.isCorrect && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  <XCircle size={11} />
                  Belum tepat — jawaban yang benar "{result.correctAnswer}"
                </div>
              )}

              {result?.ok && result.explanation ? (
                <section>
                  <h3 className="font-heading text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                    Penjelasan
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-foreground/90">
                    {result.explanation}
                  </p>
                </section>
              ) : (
                <section>
                  <h3 className="font-heading text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                    Penjelasan
                  </h3>
                  <p className="mt-1.5 text-muted-foreground">
                    Belum ada penjelasan tertulis untuk soal ini. Cek materi
                    tentang "{question.conceptName}" di halaman Topik, atau
                    tanya Spark via mode Socratic.
                  </p>
                </section>
              )}

              {result?.ok && result.commonMisconceptions && (
                <section className="mt-4">
                  <h3 className="font-heading text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                    Miskonsepsi umum
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-foreground/85">
                    {result.commonMisconceptions}
                  </p>
                </section>
              )}

              {result?.ok && result.hint && (
                <section className="mt-4">
                  <h3 className="font-heading text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                    Hint
                  </h3>
                  <p className="mt-1.5 text-foreground/85">{result.hint}</p>
                </section>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4">
              <Button
                onClick={onClose}
                size="sm"
                className="rounded-full bg-[var(--purple)] text-white"
              >
                Tutup
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
