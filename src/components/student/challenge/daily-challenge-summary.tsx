"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeSource = "AUTO_DAILY" | "AUTO_WEEKLY" | "ON_DEMAND";

interface DailyChallenge {
  id: string;
  title: string;
  status: ChallengeStatus;
  source: ChallengeSource;
  subject: { name: string; icon: string | null; color: string | null } | null;
  itemCount: number;
  completedItemCount: number;
  totalPoints: number;
  mixConfig: { questions: number; materials: number; reflections: number };
}

export function DailyChallengeSummary({
  challenges,
}: {
  challenges: DailyChallenge[];
}) {
  const totalItems = challenges.reduce((acc, c) => acc + c.itemCount, 0);
  const completedItems = challenges.reduce(
    (acc, c) => acc + c.completedItemCount,
    0,
  );
  const totalPoints = challenges.reduce(
    (acc, c) => acc + (c.status === "COMPLETED" ? c.totalPoints + 25 : 0),
    0,
  );
  const allDone = totalItems > 0 && completedItems === totalItems;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-12 size-32 rounded-full bg-[var(--purple)]/20 opacity-60 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
          Tantangan Hari Ini
        </p>
        <span className="rounded-full bg-[color-mix(in_oklch,var(--purple)_12%,transparent)] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--purple)]">
          <span className="inline-block size-1.5 animate-pulse-soft rounded-full bg-[var(--purple)]" />{" "}
          AI-generated
        </span>
      </div>
      <h2 className="relative mt-1.5 font-heading text-[18px] font-bold leading-tight">
        {allDone
          ? "Mantap! Tantangan hari ini sudah selesai 🎉"
          : `${challenges.length} tantangan, ${totalItems} item`}
      </h2>
      <p className="relative mt-1 text-[12px] text-muted-foreground">
        Campuran soal, materi, dan refleksi yang dipersonalisasi buat kamu.
      </p>

      {totalItems > 0 && (
        <div className="relative mt-3.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--coral)] transition-all"
            style={{ width: `${(completedItems / totalItems) * 100}%` }}
          />
        </div>
      )}

      <div className="relative mt-3 space-y-1.5">
        {challenges.slice(0, 3).map((c) => {
          const _pct =
            c.itemCount > 0 ? (c.completedItemCount / c.itemCount) * 100 : 0;
          return (
            <Link
              key={c.id}
              href={`/challenge/${c.id}`}
              className="group/dc flex items-center gap-2.5 rounded-2xl border border-border/40 bg-background/40 p-2.5 transition-all hover:border-[var(--purple)]/30"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-xl text-[16px]"
                style={{
                  background: c.subject?.color
                    ? `linear-gradient(135deg, ${c.subject.color}30, transparent)`
                    : "var(--purple)/10",
                }}
              >
                {c.subject?.icon ?? "✨"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[12.5px] font-bold">
                  {c.title}
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  {c.completedItemCount}/{c.itemCount} selesai
                </p>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover/dc:translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold text-muted-foreground">
          {totalPoints} XP hari ini
        </span>
        <Button
          asChild
          size="sm"
          className="h-9 rounded-full bg-[var(--purple)] text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
        >
          <Link href="/challenge">
            Lihat semua
            <ChevronRight size={13} />
          </Link>
        </Button>
      </div>
    </article>
  );
}
