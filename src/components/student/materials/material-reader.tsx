"use client";

import { ArrowLeft, BookOpen, Check, Clock } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
type MaterialSource = "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE" | "AI_GENERATED";

interface MaterialDetail {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  source: MaterialSource;
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  relatedChallenges: Array<{
    id: string;
    title: string;
    status: "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  }>;
}

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; color: string; bg: string }
> = {
  EASY: {
    label: "Dasar",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  MEDIUM: {
    label: "Sedang",
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

export function MaterialReader({
  material,
  onMarkRead,
}: {
  material: MaterialDetail;
  onMarkRead: (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => Promise<void>;
}) {
  const [marking, setMarking] = React.useState(false);
  const [isRead, setIsRead] = React.useState(material.read?.completed ?? false);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const meta = DIFFICULTY_META[material.difficulty];

  async function handleMarkRead() {
    setMarking(true);
    const elapsed = startRef.current
      ? Math.round((Date.now() - startRef.current) / 1000)
      : 0;
    await onMarkRead(material.id, elapsed, true);
    setMarking(false);
    setIsRead(true);
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <div>
        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={12} />
          Kembali ke perpustakaan
        </Link>
      </div>

      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.7 0.15 200 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-1.5">
              {material.subject && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: material.subject.color ?? "var(--teal)" }}
                >
                  <span>{material.subject.icon ?? "📚"}</span>
                  {material.subject.name}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  meta.color,
                  meta.bg,
                )}
              >
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Clock size={10} strokeWidth={2.5} />
                {material.estimatedMinutes} menit
              </span>
            </div>
            <h1 className="mt-2 font-heading text-[22px] font-bold leading-tight sm:text-[26px]">
              {material.title}
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--teal)]/20 bg-[var(--teal)]/5 px-2.5 py-1 text-[10.5px] font-medium text-foreground/80">
              <BookOpen size={10} className="text-[var(--teal)]" />
              Materi ini AI-generated. Konfirmasi ke guru untuk hal-hal penting.
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <article className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-7">
          <DocumentMarkdownText text={material.content} />

          {material.keyPoints.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--teal)]/20 bg-[var(--teal)]/5 p-3.5">
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

          <div className="mt-6 flex items-center justify-between gap-2">
            <span className="text-[10.5px] text-muted-foreground">
              {isRead ? "✓ Sudah ditandai selesai" : "Belum ditandai selesai"}
            </span>
            {!isRead && (
              <Button
                type="button"
                onClick={handleMarkRead}
                disabled={marking}
                className="h-10 rounded-full bg-[var(--teal)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
              >
                <Check size={14} strokeWidth={2.5} />
                Tandai sudah dibaca
              </Button>
            )}
          </div>
        </article>
      </Reveal>

      {material.relatedChallenges.length > 0 && (
        <Reveal delay={140}>
          <section className="space-y-2.5">
            <h2 className="font-heading text-[14px] font-bold uppercase tracking-widest text-muted-foreground">
              Tantangan Terkait
            </h2>
            {material.relatedChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/challenge/${c.id}`}
                className="flex items-center gap-2.5 rounded-2xl border border-border/40 bg-card/80 p-3 transition-all hover:border-[var(--coral)]/30"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-[var(--coral)]/10 text-[var(--coral)] text-[14px]">
                  🎯
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{c.title}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {c.status}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        </Reveal>
      )}
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
