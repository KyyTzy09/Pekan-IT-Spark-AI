"use client";

import { Check, Clock } from "lucide-react";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Button } from "@/components/ui/button";

type ChallengeItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface ChallengeMaterialViewProps {
  itemId: string;
  status: ChallengeItemStatus;
  material: {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    estimatedMinutes: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  };
  onComplete: (itemId: string) => Promise<{ ok: boolean; error?: string }>;
  onSkip: (itemId: string) => Promise<{ ok: boolean; error?: string }>;
  onMarkRead?: (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => Promise<void>;
}

const DIFFICULTY_META: Record<
  "EASY" | "MEDIUM" | "HARD" | "ADVANCED",
  { label: string; color: string; bg: string }
> = {
  EASY: {
    label: "Dasar",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  MEDIUM: {
    label: "Menengah",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-500/15",
  },
  HARD: {
    label: "Lanjut",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-500/15",
  },
  ADVANCED: {
    label: "Tantangan",
    color: "text-fuchsia-700 dark:text-fuchsia-300",
    bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15",
  },
};

export function ChallengeMaterialView({
  itemId,
  status,
  material,
  onComplete,
  onSkip,
  onMarkRead,
}: ChallengeMaterialViewProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [readSeconds, _setReadSeconds] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const markedDoneRef = React.useRef(false);
  const onMarkReadRef = React.useRef(onMarkRead);
  onMarkReadRef.current = onMarkRead;

  React.useEffect(() => {
    startRef.current = Date.now();
    return () => {
      if (startRef.current && !markedDoneRef.current && onMarkReadRef.current) {
        const elapsed = Math.round((Date.now() - startRef.current) / 1000);
        onMarkReadRef.current(material.id, elapsed, false);
      }
    };
  }, [material.id]);

  const meta = DIFFICULTY_META[material.difficulty];
  const isDone = status === "COMPLETED";

  async function handleMarkDone() {
    setSubmitting(true);
    setError(null);
    const elapsed = startRef.current
      ? Math.round((Date.now() - startRef.current) / 1000)
      : readSeconds;
    if (onMarkRead) await onMarkRead(material.id, elapsed, true);
    markedDoneRef.current = true;
    const res = await onComplete(itemId);
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Gagal");
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${meta.color} ${meta.bg}`}
          >
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Clock size={10} strokeWidth={2.5} />
            {material.estimatedMinutes} menit
          </span>
        </div>
        <h4 className="mt-2 font-heading text-[15px] font-bold leading-snug">
          {material.title}
        </h4>
      </div>

      <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
        <DocumentMarkdownText text={material.content} />
      </div>

      {material.keyPoints.length > 0 && (
        <div className="rounded-2xl border border-[var(--teal)]/20 bg-[var(--teal)]/5 p-3.5">
          <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--teal)]">
            Poin Penting
          </p>
          <ul className="mt-1.5 space-y-1 pl-4 text-[12.5px] leading-relaxed">
            {material.keyPoints.map((kp) => (
              <li key={kp} className="list-disc">
                {kp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {error}
        </p>
      )}

      {!isDone && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleMarkDone}
            disabled={submitting}
            className="h-10 flex-1 rounded-full bg-[var(--teal)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
          >
            <Check size={14} strokeWidth={2.5} />
            Sudah baca &amp; paham
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

      {isDone && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Check size={12} strokeWidth={3} />
          Sudah ditandai selesai
        </p>
      )}
    </div>
  );
}
