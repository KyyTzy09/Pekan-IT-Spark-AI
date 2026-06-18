"use client";

import {
  ArrowLeft,
  BookOpen,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import {
  type BadgeUnlock,
  useBadgeCelebration,
} from "@/components/student/badge-unlock-provider";
import { ChallengeItemRenderer } from "@/components/student/challenge/challenge-item-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeItemKind = "QUESTION" | "MATERIAL" | "REFLECTION";
type ChallengeItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface ChallengeDetailItem {
  id: string;
  order: number;
  kind: ChallengeItemKind;
  status: ChallengeItemStatus;
  points: number;
  completedAt: string | null;
  prompt: string | null;
  answer: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    hint: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    conceptName: string;
    topicName: string;
  } | null;
  material: {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    estimatedMinutes: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  } | null;
}

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  source: "AUTO_DAILY" | "AUTO_WEEKLY" | "ON_DEMAND";
  scheduledFor: string;
  generatedAt: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  mixConfig: { questions: number; materials: number; reflections: number };
  items: ChallengeDetailItem[];
  reflection: {
    id: string;
    prompt: string;
    response: string;
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    depth: "SURFACE" | "MODERATE" | "DEEP";
    suggestions: string[] | null;
    submittedAt: string;
  } | null;
}

interface ChallengeDetailViewProps {
  challenge: ChallengeDetail;
  onCompleteItem: (
    itemId: string,
    answer?: string,
  ) => Promise<{
    ok: boolean;
    error?: string;
    challengeCompleted?: boolean;
    unlockedBadges?: BadgeUnlock[];
  }>;
  onMarkMaterialRead: (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => Promise<{ ok: boolean; error?: string; unlockedBadges?: BadgeUnlock[] }>;
  onSubmitReflection: (
    challengeId: string,
    response: string,
  ) => Promise<{
    ok: boolean;
    error?: string;
    unlockedBadges?: BadgeUnlock[];
    analysis?: { sentiment: string; depth: string; suggestions: string[] };
  }>;
}

const STATUS_META: Record<
  ChallengeStatus,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: {
    label: "Belum selesai",
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

const KIND_LABEL: Record<ChallengeItemKind, string> = {
  QUESTION: "Soal",
  MATERIAL: "Materi",
  REFLECTION: "Refleksi",
};

const KIND_ICON = {
  QUESTION: Sparkles,
  MATERIAL: BookOpen,
  REFLECTION: MessageCircle,
} as const;

export function ChallengeDetailView({
  challenge,
  onCompleteItem,
  onMarkMaterialRead,
  onSubmitReflection,
}: ChallengeDetailViewProps) {
  const router = useRouter();
  const { showBadges } = useBadgeCelebration();
  const [localStatus, setLocalStatus] = React.useState(challenge.status);
  const [_busy, setBusy] = React.useState(false);

  const meta = STATUS_META[localStatus];
  const totalItems = challenge.items.length;
  const completedItems = challenge.items.filter(
    (i) => i.status === "COMPLETED" || i.status === "SKIPPED",
  ).length;
  const progressPct =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const totalPoints = challenge.items.reduce((acc, i) => acc + i.points, 0);

  const handleComplete = async (itemId: string, answer?: string) => {
    setBusy(true);
    const res = await onCompleteItem(itemId, answer);
    setBusy(false);
    if (res.ok) {
      router.refresh();
      if (res.challengeCompleted) setLocalStatus("COMPLETED");
      if (res.unlockedBadges?.length) {
        showBadges(res.unlockedBadges);
      }
    }
    return res;
  };

  const handleSkip = async (itemId: string) => {
    setBusy(true);
    const res = await fetch(`/api/challenge/${challenge.id}/item/${itemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "skip" }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      router.refresh();
    }
    return data;
  };

  const handleReflection = async (challengeId: string, response: string) => {
    setBusy(true);
    const res = await onSubmitReflection(challengeId, response);
    setBusy(false);
    if (res.ok) {
      router.refresh();
      if (res.unlockedBadges?.length) {
        showBadges(res.unlockedBadges);
      }
    }
    return res;
  };

  const handleMarkRead = async (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => {
    const res = await onMarkMaterialRead(materialId, readSeconds, completed);
    if (res?.ok && res.unlockedBadges?.length) {
      showBadges(res.unlockedBadges);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
        >
          <Link href="/challenge">
            <ArrowLeft size={13} />
            Kembali
          </Link>
        </Button>
      </div>

      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.65 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative">
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
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  meta.color,
                  meta.bg,
                )}
              >
                {meta.label}
              </span>
              {challenge.source === "ON_DEMAND" && (
                <span className="rounded-full bg-[var(--purple)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  Custom
                </span>
              )}
            </div>
            <h1 className="mt-2 font-heading text-[22px] font-bold leading-tight sm:text-[26px]">
              {challenge.title}
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
              {challenge.description}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10.5px] font-bold text-muted-foreground">
              <Trophy size={11} className="text-[var(--coral)]" />
              {totalPoints + (localStatus === "COMPLETED" ? 25 : 0)} XP
              <span>·</span>
              <span>
                {completedItems}/{totalItems} item selesai
              </span>
            </div>
          </div>
          {totalItems > 0 && (
            <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  localStatus === "COMPLETED"
                    ? "bg-emerald-500"
                    : "bg-[var(--coral)]",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </header>
      </Reveal>

      <div className="space-y-3">
        {challenge.items.map((item, i) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <Reveal key={item.id} delay={i * 60}>
              <article className="rounded-2xl border border-border/40 bg-card/80 p-4 shadow-[0_4px_14px_rgba(80,20,50,0.04)] backdrop-blur-md sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-xl",
                        item.kind === "QUESTION"
                          ? "bg-[var(--purple)]/10 text-[var(--purple)]"
                          : item.kind === "MATERIAL"
                            ? "bg-[var(--teal)]/10 text-[var(--teal)]"
                            : "bg-[var(--coral)]/10 text-[var(--coral)]",
                      )}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                        {KIND_LABEL[item.kind]} · {item.points} XP
                      </p>
                      {item.status === "COMPLETED" && (
                        <p className="text-[10.5px] font-bold text-emerald-600">
                          ✓ Selesai
                        </p>
                      )}
                      {item.status === "SKIPPED" && (
                        <p className="text-[10.5px] font-bold text-muted-foreground">
                          Dilewati
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <ChallengeItemRenderer
                  item={item}
                  challengeId={challenge.id}
                  onCompleteItem={handleComplete}
                  onSkipItem={handleSkip}
                  onSubmitReflection={handleReflection}
                  onMarkMaterialRead={handleMarkRead}
                />
              </article>
            </Reveal>
          );
        })}
      </div>

      {localStatus === "COMPLETED" && (
        <Reveal delay={120}>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5 text-center shadow-[0_8px_24px_rgba(20,184,166,0.08)] backdrop-blur-md dark:bg-emerald-500/10">
            <Trophy size={28} className="mx-auto text-emerald-600" />
            <p className="mt-2 font-heading text-[16px] font-bold text-emerald-700 dark:text-emerald-300">
              Tantangan selesai! 🎉
            </p>
            <p className="mt-1 text-[12.5px] text-emerald-700/85 dark:text-emerald-300/80">
              +{totalPoints + 25} XP. Lanjut tantangan besok atau coba topik
              baru!
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
