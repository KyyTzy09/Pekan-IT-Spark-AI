import { ArrowLeft, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { PracticePlayer } from "@/components/student/practice-player";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
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
  searchParams: Promise<{ topicId?: string; subject?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const topicId = sp.topicId ?? undefined;
  const subjectSlug = sp.subject ?? undefined;

  // Fetch student profile to filter subjects they are focused on
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { focusedSubjects: true },
  });
  const focusedIds = profile?.focusedSubjects ?? [];

  const [nextResult, stats, subjects] = await Promise.all([
    getNextPracticeQuestion({ topicId, subjectSlug }),
    getPracticeStats(),
    prisma.subject.findMany({
      where: {
        isActive: true,
        ...(focusedIds.length > 0 ? { id: { in: focusedIds } } : {}),
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        icon: true,
        color: true,
      },
    }),
  ]);

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

      {/* Horizontal Subject Switcher */}
      {subjects.length > 0 && (
        <Reveal delay={40}>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Pilih Mata Pelajaran
            </span>
            <div className="flex flex-wrap gap-2 pb-1">
              {/* "Semua Mapel" Tab */}
              <Link
                href="/practice"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all border",
                  !subjectSlug
                    ? "bg-[var(--purple)] border-[var(--purple)] text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
                    : "bg-card/60 hover:bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <span>📚</span>
                <span>Semua Mapel</span>
              </Link>

              {/* Subject Tabs */}
              {subjects.map((sub) => {
                const isSelected = subjectSlug === sub.slug;
                const subColor = sub.color || "var(--purple)";
                return (
                  <Link
                    key={sub.id}
                    href={`/practice?subject=${sub.slug}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all border",
                      isSelected
                        ? "text-white"
                        : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground hover:bg-card/90",
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: subColor,
                            borderColor: subColor,
                            boxShadow: `0 4px 12px ${subColor}30`,
                          }
                        : {
                            borderColor: `${subColor}20`,
                          }
                    }
                  >
                    <span className="text-[14px]">{sub.icon ?? "📚"}</span>
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Practice Content */}
      {!nextResult.ok ? (
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
      ) : (
        <Reveal delay={80}>
          <PracticePlayer
            initialSession={nextResult.session}
            initialStats={stats ?? FALLBACK_STATS}
            subjectSlug={subjectSlug}
            topicId={topicId}
          />
        </Reveal>
      )}
    </div>
  );
}
