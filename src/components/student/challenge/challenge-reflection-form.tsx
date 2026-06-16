"use client";

import { Heart, Send } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

type ChallengeItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface ChallengeReflectionFormProps {
  itemId: string;
  status: ChallengeItemStatus;
  challengeId: string;
  prompt: string;
  existingResponse?: string | null;
  existingAnalysis?: {
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    depth: "SURFACE" | "MODERATE" | "DEEP";
    suggestions: string[];
  } | null;
  onSubmit: (
    challengeId: string,
    response: string,
  ) => Promise<{
    ok: boolean;
    analysis?: { sentiment: string; depth: string; suggestions: string[] };
    error?: string;
  }>;
  onSkip: (itemId: string) => Promise<{ ok: boolean; error?: string }>;
}

const SENTIMENT_LABEL: Record<string, { label: string; color: string }> = {
  POSITIVE: {
    label: "Semangat",
    color: "text-emerald-700 dark:text-emerald-300",
  },
  NEUTRAL: { label: "Netral", color: "text-muted-foreground" },
  NEGATIVE: {
    label: "Butuh semangat",
    color: "text-rose-600 dark:text-rose-400",
  },
};

const DEPTH_LABEL: Record<string, { label: string; color: string }> = {
  SURFACE: { label: "Refleksi singkat", color: "text-muted-foreground" },
  MODERATE: {
    label: "Cukup dalam",
    color: "text-amber-700 dark:text-amber-300",
  },
  DEEP: { label: "Sangat dalam", color: "text-[var(--purple)]" },
};

export function ChallengeReflectionForm({
  itemId,
  status,
  challengeId,
  prompt,
  existingResponse,
  existingAnalysis,
  onSubmit,
  onSkip,
}: ChallengeReflectionFormProps) {
  const [response, setResponse] = React.useState(existingResponse ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState(existingAnalysis ?? null);

  const isDone = status === "COMPLETED" || analysis !== null;
  const charCount = response.length;
  const minChars = 20;
  const canSubmit = charCount >= minChars;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(challengeId, response);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal submit");
      return;
    }
    if (res.analysis) {
      setAnalysis({
        sentiment: res.analysis.sentiment as
          | "POSITIVE"
          | "NEUTRAL"
          | "NEGATIVE",
        depth: res.analysis.depth as "SURFACE" | "MODERATE" | "DEEP",
        suggestions: res.analysis.suggestions,
      });
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    setError(null);
    const res = await onSkip(itemId);
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Gagal");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
          Refleksi
        </p>
        <h4 className="mt-1.5 font-heading text-[14px] font-bold leading-snug">
          {prompt}
        </h4>
      </div>

      <div className="rounded-2xl border border-border/40 bg-background/60 p-3">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Tulis refleksi kamu di sini... (min 20 karakter)"
          rows={5}
          disabled={isDone}
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-between text-[10.5px] font-bold">
          <span
            className={
              charCount < minChars
                ? "text-muted-foreground"
                : "text-emerald-600"
            }
          >
            {charCount} karakter{" "}
            {charCount < minChars ? `(min ${minChars})` : "✓"}
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {error}
        </p>
      )}

      {analysis && (
        <div className="space-y-2 rounded-2xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 p-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10.5px] font-bold uppercase tracking-widest ${SENTIMENT_LABEL[analysis.sentiment]?.color}`}
            >
              {SENTIMENT_LABEL[analysis.sentiment]?.label}
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              className={`text-[10.5px] font-bold uppercase tracking-widest ${DEPTH_LABEL[analysis.depth]?.color}`}
            >
              {DEPTH_LABEL[analysis.depth]?.label}
            </span>
          </div>
          {analysis.suggestions.length > 0 && (
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--purple)]">
                Saran Spark
              </p>
              <ul className="mt-1 space-y-1 pl-4 text-[12.5px] leading-relaxed text-foreground/85">
                {analysis.suggestions.map((s) => (
                  <li key={s} className="list-disc">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isDone && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-10 flex-1 rounded-full bg-[var(--purple)] text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)] disabled:opacity-40"
          >
            <Send size={13} strokeWidth={2.5} />
            Kirim refleksi
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

      {isDone && !analysis && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Heart size={12} strokeWidth={2.5} />
          Refleksi tersimpan
        </p>
      )}
    </div>
  );
}
