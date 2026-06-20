"use client";

import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChallengeItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface ChallengeQuestionFormProps {
  itemId: string;
  status: ChallengeItemStatus;
  question: {
    id: string;
    questionText: string;
    options: string[];
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    conceptName: string;
    topicName: string;
    correctAnswer: string;
    explanation: string | null;
  };
  prefillAnswer?: string | null;
  prefillIsCorrect?: boolean | null;
  onComplete: (
    itemId: string,
    answer: string,
  ) => Promise<{
    ok: boolean;
    isCorrect?: boolean;
    correctAnswer?: string;
    explanation?: string | null;
    error?: string;
  }>;
  onSkip: (itemId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ChallengeQuestionForm({
  itemId,
  status,
  question,
  prefillAnswer,
  prefillIsCorrect,
  onComplete,
  onSkip,
}: ChallengeQuestionFormProps) {
  const explanationTimerRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  React.useEffect(() => () => clearTimeout(explanationTimerRef.current), []);
  const [selected, setSelected] = React.useState<string | null>(
    prefillAnswer ?? null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string | null;
  } | null>(
    prefillIsCorrect !== null && prefillIsCorrect !== undefined
      ? {
          isCorrect: prefillIsCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        }
      : null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [loadingExplanation, setLoadingExplanation] = React.useState(false);

  React.useEffect(() => {
    setSelected(prefillAnswer ?? null);
    setResult(
      prefillIsCorrect !== null && prefillIsCorrect !== undefined
        ? {
            isCorrect: prefillIsCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          }
        : null,
    );
    setError(null);
    setShowExplanation(false);
    setLoadingExplanation(false);
  }, [prefillAnswer, prefillIsCorrect, question]);

  const isDone = status === "COMPLETED" || result !== null;

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    const res = await onComplete(itemId, selected);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal submit");
      return;
    }
    if (res.correctAnswer) {
      setResult({
        isCorrect: res.isCorrect ?? false,
        correctAnswer: res.correctAnswer,
        explanation: res.explanation ?? null,
      });
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    setError(null);
    const res = await onSkip(itemId);
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Gagal skip");
  }

  function triggerExplanation() {
    setLoadingExplanation(true);
    explanationTimerRef.current = setTimeout(() => {
      setLoadingExplanation(false);
      setShowExplanation(true);
    }, 800);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
          {question.topicName} · {question.conceptName} · {question.difficulty}
        </p>
        <h4 className="mt-1.5 font-heading text-[15px] font-bold leading-snug">
          {question.questionText}
        </h4>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selected === opt;
          const isCorrectAnswer = result?.correctAnswer === opt;
          const isWrongSelection = result && !result.isCorrect && isSelected;
          return (
            <button
              key={opt}
              type="button"
              disabled={isDone || submitting}
              onClick={() => setSelected(opt)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all",
                isCorrectAnswer
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : isWrongSelection
                    ? "border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : isSelected
                      ? "border-[var(--coral)]/40 bg-[var(--coral)]/5"
                      : "border-border/40 bg-background/60 hover:border-border",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                  isCorrectAnswer || isWrongSelection
                    ? "border-transparent bg-white/50"
                    : isSelected
                      ? "border-[var(--coral)]/30 bg-[var(--coral)]/10 text-[var(--coral)]"
                      : "border-border/40 bg-background text-muted-foreground",
                )}
              >
                {isCorrectAnswer ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : isWrongSelection ? (
                  <XCircle size={14} className="text-rose-600" />
                ) : (
                  letter
                )}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {error}
        </p>
      )}

      {/* ── Explanation Block ── */}
      {result && (
        <div className="space-y-3">
          {/* If correct, show explanation immediately */}
          {result.isCorrect && result.explanation && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="grid size-6 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  Jawaban Benar & Penjelasan
                </p>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-line">
                {result.explanation}
              </p>
            </div>
          )}

          {/* If incorrect, show the "Ask AI / Explain" button first */}
          {!result.isCorrect &&
            (!showExplanation ? (
              <div className="flex justify-start anim-slide-up gpu">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerExplanation}
                  disabled={loadingExplanation}
                  className="rounded-2xl border-[var(--coral)]/30 bg-[var(--coral)]/5 hover:bg-[var(--coral)]/10 text-[var(--coral)] font-bold text-[12px] px-4 py-2 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.97]"
                >
                  {loadingExplanation ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Spark sedang merumuskan penjelasan...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[var(--coral)]" />
                      Jelaskan Kenapa Ini Salah
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--coral)]/20 bg-[var(--coral)]/5 p-4 anim-fade-in shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-sm">
                    <Sparkles size={11} strokeWidth={2.5} />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--coral)]">
                    Spark Menjelaskan
                  </p>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-line">
                  {result.explanation ||
                    "Maaf, belum ada penjelasan terperinci untuk soal ini."}
                </p>
              </div>
            ))}
        </div>
      )}

      {!isDone && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="h-10 flex-1 rounded-full bg-[var(--coral)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)] disabled:opacity-40"
          >
            <Sparkles size={14} strokeWidth={2.5} />
            Submit
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={submitting}
            className="h-10 rounded-full text-[12.5px] text-muted-foreground"
          >
            Lewati
          </Button>
        </div>
      )}
    </div>
  );
}
