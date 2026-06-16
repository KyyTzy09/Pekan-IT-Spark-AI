"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Reveal } from "@/components/shared/reveal";
import { PracticePlayer } from "@/components/student/practice-player";
import { Button } from "@/components/ui/button";
import type { PracticeSession, PracticeStats } from "@/server/actions/practice";

export const dynamic = "force-dynamic";

type PracticeApiResponse = {
  nextResult:
    | { ok: true; session: PracticeSession }
    | { ok: false; error: string };
  stats: PracticeStats | null;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-64 rounded bg-muted" />
          </div>
        </header>
      </Reveal>
      <Reveal delay={80}>
        <div className="rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Memuat soal latihan...</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

const FALLBACK_STATS: PracticeStats = {
  accuracyPct: 0,
  recentTotal: 0,
  masteredCount: 0,
  strugglingCount: 0,
  currentDifficulty: "EASY",
  recommendedDifficulty: "EASY",
  longestStreak: 0,
};

export default function PracticePage() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topicId") ?? undefined;
  const { data: session, status: authStatus } = useSession();

  const { data, isLoading } = useQuery<PracticeApiResponse>({
    queryKey: ["practice", "next", topicId],
    queryFn: () =>
      fetch(`/api/practice${topicId ? `?topicId=${topicId}` : ""}`).then((r) =>
        r.json(),
      ),
  });

  if (authStatus === "loading" || isLoading) {
    return <LoadingSkeleton />;
  }

  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return (
      <div className="space-y-5 sm:space-y-7">
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
              }}
            />
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
              <Target size={10} strokeWidth={2.5} />
              Latihan adaptif
            </span>
            <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
              Login dulu yuk
            </h1>
            <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
              Mode latihan adaptif khusus buat siswa Spark. Masuk dulu biar bisa
              mulai jawab soal yang naik-turun sesuai level kamu.
            </p>
          </header>
        </Reveal>
      </div>
    );
  }

  if (!data) return null;

  const { nextResult, stats } = data;

  if (!nextResult.ok) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
              }}
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  <Target size={10} strokeWidth={2.5} />
                  Latihan adaptif
                </span>
                <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
                  Mode latihan{" "}
                  <span className="text-gradient-cool">Spark Practice</span>
                </h1>
                <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                  Soal yang naik-turun sesuai performa kamu. Jawab, dapet
                  feedback instan, lanjut.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/dashboard">
                  <ArrowLeft size={13} />
                  Beranda
                </Link>
              </Button>
            </div>
          </header>
        </Reveal>
        <Reveal delay={80}>
          <div className="rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl">
            <Sparkles size={28} className="mx-auto text-[var(--coral)]" />
            <p className="mt-3 font-heading text-[16px] font-bold">
              Belum bisa mulai latihan
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {nextResult.error ||
                "Tambah mapel dulu atau kembali lagi nanti ya."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[var(--coral)] text-white"
              >
                <Link href="/subjects">Jelajahi mapel</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                <Target size={10} strokeWidth={2.5} />
                Latihan adaptif
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
                Mode latihan{" "}
                <span className="text-gradient-cool">Spark Practice</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                Soal yang naik-turun sesuai performa kamu. Jawab, dapet feedback
                instan, lanjut.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/dashboard">
                <ArrowLeft size={13} />
                Beranda
              </Link>
            </Button>
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <PracticePlayer
          initialSession={nextResult.session}
          initialStats={stats ?? FALLBACK_STATS}
          topicId={topicId}
        />
      </Reveal>
    </div>
  );
}
