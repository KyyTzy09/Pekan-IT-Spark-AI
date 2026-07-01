"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ChallengeStatus = "GENERATING" | "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
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
  loading = false,
  generating = false,
  error = false,
}: {
  challenges: DailyChallenge[];
  loading?: boolean;
  generating?: boolean;
  error?: boolean;
}) {
  // Loading / generating state
  if (loading || generating) {
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
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--purple)]" />{" "}
            {generating ? "Generating..." : "Loading..."}
          </span>
        </div>
        <h2 className="relative mt-1.5 font-heading text-[18px] font-bold leading-tight">
          {generating
            ? "AI sedang menyiapkan tantanganmu... 🤖"
            : "Memuat tantangan hari ini..."}
        </h2>
        <p className="relative mt-1 text-[12px] text-muted-foreground">
          {generating
            ? "Biasanya butuh 10-30 detik. Jangan tutup halaman ini ya!"
            : "Tunggu sebentar..."}
        </p>
        <div className="relative mt-4 flex gap-2">
          <div className="h-2 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-2 w-12 animate-pulse rounded-full bg-muted" />
          <div className="h-2 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </article>
    );
  }

  // Error state
  if (error) {
    return (
      <article className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-12 size-32 rounded-full bg-red-500/20 opacity-60 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
            Gagal Memuat
          </p>
        </div>
        <h2 className="relative mt-1.5 font-heading text-[18px] font-bold leading-tight">
          Gagal memuat tantangan 😔
        </h2>
        <p className="relative mt-1 text-[12px] text-muted-foreground">
          Coba refresh halaman atau tunggu beberapa saat lalu coba lagi.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="relative mt-4"
          onClick={() => window.location.reload()}
        >
          Refresh Halaman
        </Button>
      </article>
    );
  }

  // Empty state
  if (challenges.length === 0) {
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
        </div>
        <h2 className="relative mt-1.5 font-heading text-[18px] font-bold leading-tight">
          Belum ada tantangan hari ini
        </h2>
        <p className="relative mt-1 text-[12px] text-muted-foreground">
          Pilih mapel di Settings untuk mulai dapat tantangan harian.
        </p>
      </article>
    );
  }

  // Normal state
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

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="relative mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--purple)] transition-all duration-500"
              style={{ width: `${(completedItems / totalItems) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {completedItems}/{totalItems} item selesai
            {totalPoints > 0 && ` · ${totalPoints} XP`}
          </p>
        </div>
      )}

      {/* Challenge list */}
      <div className="relative mt-4 space-y-2">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            href={`/challenges/${challenge.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/50 p-3 transition-colors hover:bg-background/80"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
                {challenge.subject?.icon ?? "📚"} {challenge.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {challenge.completedItemCount}/{challenge.itemCount} item
                {challenge.status === "COMPLETED" && " · ✅ Selesai"}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* View all link */}
      <Link
        href="/challenges"
        className="relative mt-4 flex items-center gap-1 text-[12px] font-semibold text-[var(--purple)] hover:underline"
      >
        Lihat semua tantangan
        <ChevronRight className="size-3" />
      </Link>
    </article>
  );
}
