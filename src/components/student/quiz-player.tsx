"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader2,
  Target,
  Timer,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  abortQuizSession,
  getQuizResult,
  type QuizSession,
  startQuizSession,
  submitQuizAnswer,
} from "@/server/actions/practice";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizPlayer({
  initialSession,
}: {
  initialSession: QuizSession;
}) {
  const router = useRouter();
  const [session] = React.useState<QuizSession>(initialSession);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(initialSession.timeLimitSec);
  const [error, setError] = React.useState<string | null>(null);
  const [showReview, setShowReview] = React.useState<{
    isCorrect: boolean;
    correctAnswer: string;
  } | null>(null);
  const questionStartedAt = React.useRef<number>(Date.now());
  const finishedRef = React.useRef(false);

  const currentQuestion = session.questions[currentIdx];
  const isLast = currentIdx === session.questions.length - 1;
  const isAnswered = showReview !== null;
  const totalQ = session.questions.length;

  React.useEffect(() => {
    if (finishedRef.current) return;
    const t = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (timeLeft > 0 || finishedRef.current) return;
    finishedRef.current = true;
    void finishQuiz(true);
  }, [timeLeft]);

  React.useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentIdx]);

  const finishQuiz = async (timedOut: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const result = await getQuizResult({ sessionId: session.sessionId });
    if (result.ok) {
      const params = new URLSearchParams({
        sessionId: result.sessionId,
        total: String(result.totalQuestions),
        correct: String(result.correctCount),
        pct: String(result.scorePct),
        time: String(result.timeUsedSec),
        topic: result.topicName,
        subject: result.subjectName,
        breakdown: JSON.stringify(result.breakdown),
        timedOut: timedOut ? "1" : "0",
      });
      router.push(`/practice/quiz/result?${params.toString()}`);
    } else {
      setError(result.error);
    }
  };

  const onSubmit = async () => {
    if (!selected || submitting || isAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitQuizAnswer({
        sessionId: session.sessionId,
        questionId: currentQuestion.id,
        answer: selected,
        timeSpentSec: Math.round(
          (Date.now() - questionStartedAt.current) / 1000,
        ),
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setShowReview({ isCorrect: r.isCorrect, correctAnswer: r.correctAnswer });
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (isLast) {
      void finishQuiz(false);
      return;
    }
    setSelected(null);
    setShowReview(null);
    setCurrentIdx((idx) => idx + 1);
  };

  if (!currentQuestion) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 text-center text-[12.5px] text-muted-foreground">
        Soal quiz ga ketemu.
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <QuizHeader
        session={session}
        currentIdx={currentIdx}
        totalQ={totalQ}
        timeLeft={timeLeft}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
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
              background:
                "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--coral)]/10 px-2.5 py-0.5 text-[var(--coral)]">
              <Target size={10} strokeWidth={2.5} />
              Soal {currentIdx + 1}/{totalQ}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-muted-foreground">
              {currentQuestion.conceptName} · {currentQuestion.difficulty}
            </span>
            {timeLeft <= 30 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                  timeLeft <= 10
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                )}
              >
                <Clock size={10} strokeWidth={2.5} />
                {timeLeft}s
              </span>
            )}
          </div>

          <h2 className="relative mt-4 font-heading text-[18px] font-bold leading-snug sm:text-[20px]">
            {currentQuestion.questionText}
          </h2>

          <ul className="relative mt-5 grid gap-2.5">
            {currentQuestion.options.map((opt, i) => {
              const letter = LETTERS[i] ?? String(i);
              const isSelected = selected === letter;
              const correctLetter = showReview?.correctAnswer;
              const isCorrect = isAnswered && letter === correctLetter;
              const isWrongPick =
                isAnswered && isSelected && letter !== correctLetter;
              return (
                <li key={`${currentQuestion.id}-${letter}`}>
                  <button
                    type="button"
                    disabled={isAnswered || submitting}
                    onClick={() => setSelected(letter)}
                    className={cn(
                      "group/ans flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all",
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
                    Kirim
                    <ArrowRight size={14} className="ml-1.5" />
                  </>
                )}
              </Button>
              {error && (
                <p className="text-[12px] font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="relative mt-5 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold",
                  showReview.isCorrect
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                )}
              >
                {showReview.isCorrect ? (
                  <>
                    <CheckCircle2 size={13} /> Benar
                  </>
                ) : (
                  <>
                    <XCircle size={13} /> Belum tepat · Jawaban:{" "}
                    {showReview.correctAnswer}
                  </>
                )}
              </span>
              <Button
                onClick={onNext}
                className="rounded-full bg-[var(--purple)] px-5 text-white shadow-[0_8px_22px_rgba(124,58,237,0.35)] hover:bg-[var(--purple)]/90"
              >
                {isLast ? "Lihat hasil" : "Soal berikutnya"}
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {timeLeft <= 30 && !finishedRef.current && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-50/70 p-3 text-[12px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertTriangle size={13} className="shrink-0" />
          Waktu tinggal {timeLeft} detik. Auto-submit kalau waktu habis.
        </motion.div>
      )}
    </div>
  );
}

function QuizHeader({
  session,
  currentIdx,
  totalQ,
  timeLeft,
}: {
  session: QuizSession;
  currentIdx: number;
  totalQ: number;
  timeLeft: number;
}) {
  const pct = ((currentIdx + 1) / totalQ) * 100;
  return (
    <div className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quiz · {session.subjectName}
          </p>
          <h2 className="mt-1 font-heading text-[20px] font-bold leading-tight">
            {session.topicName}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5">
          <Timer
            size={13}
            className={cn(
              timeLeft <= 30 ? "text-rose-500" : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "font-heading text-[15px] font-bold tabular-nums",
              timeLeft <= 30 && "text-rose-600",
            )}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <CircleDashed size={11} />
        <span>
          Soal {currentIdx + 1} dari {totalQ}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--coral)] to-[var(--purple)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

void Timer;
