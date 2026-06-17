import { Heart, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AlertsSection } from "@/components/parent/alerts-section";
import { MetricsOverview } from "@/components/parent/metrics-overview";
import { ParentAiRecommendation } from "@/components/parent/ParentAiRecommendation";
import { SubjectProgress } from "@/components/parent/subject-progress";
import { WeeklyTimeline } from "@/components/parent/weekly-timeline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getParentDashboardData } from "@/server/actions/parent";

export const metadata: Metadata = {
  title: "Dashboard Orang Tua — Spark Ai",
  description:
    "Pantau perkembangan dan kebiasaan belajar anak kamu secara santai dan suportif.",
};

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const { childId } = await searchParams;
  const result = await getParentDashboardData(childId);

  if (!result.ok) {
    redirect("/auth/login");
  }

  const {
    children = [],
    activeChild,
    summary,
    timeline,
    alerts = [],
    strugglingConcepts = [],
  } = result;

  // Onboarding state if no child is linked
  if (children.length === 0 || !activeChild || !summary) {
    return (
      <div className="mx-auto max-w-3xl py-8 text-center space-y-6">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_12px_36px_rgba(20,184,166,0.2)]">
          <Heart size={36} strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-foreground sm:text-[34px]">
            Pantau Belajar Anak Jadi Lebih Mudah
          </h1>
          <p className="mx-auto max-w-lg text-[14px] leading-relaxed text-muted-foreground">
            Selamat datang di Portal Orang Tua Spark Ai! Hubungkan akun orang
            tua kamu dengan akun belajar anak untuk mulai memantau perkembangan
            belajar mereka secara santai.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-3xl border border-border/40 bg-card/60 p-6 shadow-xl backdrop-blur-xl text-left space-y-4">
          <h2 className="font-heading text-[15.5px] font-bold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--blue)]" />
            Cara Menghubungkan Akun:
          </h2>
          <ol className="text-[13px] text-muted-foreground space-y-3 list-decimal pl-4">
            <li>
              Minta anak kamu membuka aplikasi **Spark Ai** di akun belajarnya.
            </li>
            <li>
              Masuk ke menu **Pengaturan &gt; Undang Orang Tua** dan klik **Buat
              Kode**.
            </li>
            <li>Salin kode unik 8-karakter yang dihasilkan.</li>
            <li>Klik tombol di bawah ini dan masukkan kode tersebut.</li>
          </ol>
          <Button
            asChild
            className="w-full rounded-2xl font-bold bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] hover:opacity-90 transition-opacity"
          >
            <Link href="/parent/link">Hubungkan Akun Anak</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate some simple stats for the report
  const masteredCount = summary.totalMastered;
  const totalConcepts = summary.totalConcepts;
  const masteryPct =
    totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  // Calculate weekly score
  const weeklyScore =
    timeline && timeline.points.length > 0
      ? Math.round(
          timeline.points.reduce((acc, p) => acc + p.overallScore, 0) /
            timeline.points.length,
        )
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── HEADER & CHILD SELECTOR ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-5">
        <div>
          <h1 className="font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
            Portal Orang Tua
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Memantau perkembangan belajar{" "}
            <span className="font-bold text-foreground/80">
              {activeChild.name}
            </span>{" "}
            secara suportif.
          </p>
        </div>

        {/* Multi-Child Switcher */}
        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-card/65 p-1 border border-border/30 backdrop-blur-sm">
              {children.map((c) => {
                const active = c.id === activeChild.id;
                return (
                  <Link
                    key={c.id}
                    href={`/parent?childId=${c.id}`}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-all",
                      active
                        ? "bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {(c.name || "Anak").split(" ")[0]}
                  </Link>
                );
              })}
            </div>
          )}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl font-bold text-[12px] h-9"
          >
            <Link href="/parent/link" className="flex items-center gap-1">
              <Users size={12} />
              Hubungkan Anak Baru
            </Link>
          </Button>
        </div>
      </header>

      {/* ── NOTIFICATIONS & ALERTS ── */}
      <Suspense fallback={null}>
        <AlertsSection alerts={alerts} />
      </Suspense>

      {/* ── CORE METRICS OVERVIEW ── */}
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        }
      >
        <MetricsOverview
          metrics={{
            streak: summary.streak,
            level: summary.level,
            weeklyScore,
          }}
        />
      </Suspense>

      {/* ── WEEKLY ACTIVITY TIMELINE ── */}
      {timeline && timeline.points.length > 0 && (
        <Suspense
          fallback={
            <div className="rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-64 bg-muted rounded" />
            </div>
          }
        >
          <WeeklyTimeline timeline={timeline} childName={activeChild.name} />
        </Suspense>
      )}

      {/* ── SUBJECT PROGRESS REPORT & CONCEPTS ── */}
      <div className="grid gap-6 md:grid-cols-12">
        <Suspense
          fallback={
            <div className="md:col-span-7 rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            </div>
          }
        >
          <SubjectProgress subjects={summary.subjects} />
        </Suspense>

        {/* Concepts Mastered vs Struggling */}
        <section className="space-y-4 md:col-span-5 rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6">
          <header>
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              Analisis Topik & Konsep
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Detail pemahaman konsep yang sudah tuntas maupun yang membutuhkan
              latihan tambahan.
            </p>
          </header>

          <div className="space-y-5 mt-4">
            {/* Struggling Concepts */}
            <div className="space-y-2">
              <h3 className="text-[12px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                ⚠️ Perlu Latihan Tambahan
              </h3>
              <div className="space-y-1.5">
                {strugglingConcepts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/15 px-3 py-2 text-[12px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate leading-snug">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                        {c.subjectName}
                      </p>
                    </div>
                    <span className="text-[11.5px] font-bold text-amber-600 dark:text-amber-400 ml-2">
                      {Math.round(c.masteryScore * 100)}%
                    </span>
                  </div>
                ))}
                {strugglingConcepts.length === 0 && (
                  <p className="text-[11.5px] text-muted-foreground italic pl-1">
                    Bagus sekali! Tidak ada kesulitan pemahaman konsep saat ini.
                  </p>
                )}
              </div>
            </div>

            {/* General mastery info */}
            <div className="border-t border-border/20 pt-4 flex justify-between items-center gap-4 text-center">
              <div className="flex-1">
                <p className="text-[18px] font-heading font-extrabold text-[var(--teal)]">
                  {masteredCount}
                </p>
                <p className="text-[10.5px] font-semibold text-muted-foreground">
                  Konsep Tuntas
                </p>
              </div>
              <div className="h-8 w-px bg-border/20" />
              <div className="flex-1">
                <p className="text-[18px] font-heading font-extrabold text-[var(--blue)]">
                  {masteryPct}%
                </p>
                <p className="text-[10.5px] font-semibold text-muted-foreground">
                  Total Penguasaan
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── AI SPARK RECOMMENDATION (Asynchronous & Non-blocking) ── */}
      <Suspense fallback={null}>
        <ParentAiRecommendation
          studentId={activeChild.id}
          studentName={activeChild.name ?? "Anak"}
        />
      </Suspense>
    </div>
  );
}
