import { ArrowLeft, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { PracticePlayer } from "@/components/student/practice-player";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  getNextPracticeQuestion,
  getPracticeStats,
} from "@/server/actions/practice";

export const dynamic = "force-dynamic";

const FALLBACK_STATS = {
  accuracyPct: 0,
  recentTotal: 0,
  masteredCount: 0,
  strugglingCount: 0,
  currentDifficulty: "EASY" as const,
  recommendedDifficulty: "EASY" as const,
  longestStreak: 0,
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const topicId = sp.topicId ?? undefined;

  const [nextResult, stats] = await Promise.all([
    getNextPracticeQuestion(topicId ? { topicId } : undefined),
    getPracticeStats(),
  ]);

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
