"use client";

import { BookOpen, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { cn } from "@/lib/utils";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeItemKind = "QUESTION" | "MATERIAL" | "REFLECTION";
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

const _KIND_ICONS: Record<ChallengeItemKind, typeof BookOpen> = {
  QUESTION: Sparkles,
  MATERIAL: BookOpen,
  REFLECTION: MessageCircle,
};

const STATUS_META: Record<
  ChallengeStatus,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: {
    label: "Aktif",
    color: "text-[var(--coral)]",
    bg: "bg-[var(--coral)]/10",
  },
  COMPLETED: {
    label: "Selesai",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  SKIPPED: {
    label: "Dilewati",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

const SOURCE_META: Record<
  ChallengeSource,
  { label: string; color: string; bg: string }
> = {
  AUTO_DAILY: {
    label: "Harian",
    color: "text-[var(--teal)]",
    bg: "bg-[var(--teal)]/10",
  },
  AUTO_WEEKLY: {
    label: "Mingguan",
    color: "text-[var(--purple)]",
    bg: "bg-[var(--purple)]/10",
  },
  ON_DEMAND: {
    label: "Custom",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
};

export const ChallengeCard = memo(function ChallengeCard({
  challenge,
}: {
  challenge: ChallengeListItem;
}) {
  const statusMeta = STATUS_META[challenge.status];
  const sourceMeta = SOURCE_META[challenge.source];
  const mix = challenge.mixConfig;
  const progressPct =
    challenge.itemCount > 0
      ? Math.round((challenge.completedItemCount / challenge.itemCount) * 100)
      : 0;

  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="group/challenge block overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-4 shadow-[0_4px_14px_rgba(80,20,50,0.05)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(80,20,50,0.12)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {challenge.subject && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: challenge.subject.color ?? "var(--coral)" }}
              >
                <span>{challenge.subject.icon ?? "📚"}</span>
                {challenge.subject.name}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest",
                sourceMeta.color,
                sourceMeta.bg,
              )}
            >
              {sourceMeta.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest",
                statusMeta.color,
                statusMeta.bg,
              )}
            >
              {statusMeta.label}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 font-heading text-[15px] font-bold leading-tight sm:text-[16px]">
            {challenge.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {challenge.description}
          </p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover/challenge:translate-x-0.5" />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {mix.questions > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--purple)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--purple)]">
              <Sparkles size={10} strokeWidth={2.5} />
              {mix.questions} soal
            </span>
          )}
          {mix.materials > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--teal)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--teal)]">
              <BookOpen size={10} strokeWidth={2.5} />
              {mix.materials} materi
            </span>
          )}
          {mix.reflections > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--coral)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--coral)]">
              <MessageCircle size={10} strokeWidth={2.5} />
              {mix.reflections} refleksi
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {challenge.totalPoints > 0 && (
            <span className="text-[10.5px] font-bold text-muted-foreground">
              {challenge.totalPoints} XP
            </span>
          )}
          <span className="text-[10.5px] font-bold text-muted-foreground">
            {challenge.completedItemCount}/{challenge.itemCount}
          </span>
        </div>
      </div>

      {challenge.itemCount > 0 && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              challenge.status === "COMPLETED"
                ? "bg-emerald-500"
                : "bg-[var(--coral)]",
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </Link>
  );
});
