"use client";

import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
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
      ? { isCorrect: prefillIsCorrect, correctAnswer: "", explanation: null }
      : null,
  );
  const [error, setError] = React.useState<string | null>(null);

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

      {result?.explanation && (
        <div className="rounded-2xl border border-[var(--coral)]/20 bg-[var(--coral)]/5 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--coral)]">
            Kenapa?
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/85">
            {result.explanation}
          </p>
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
