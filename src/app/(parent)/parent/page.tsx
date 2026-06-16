import {
  AlertCircle,
  Award,
  Brain,
  Calendar,
  Flame,
  Heart,
  Lightbulb,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WeeklyChart } from "@/components/parent/weekly-chart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
    aiRecommendation,
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

  // Format day names for timeline
  const DAYS_INDONESIAN = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return DAYS_INDONESIAN[d.getDay()] || dateStr;
  };

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
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-[12.5px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={13} className="text-muted-foreground" />
            Notifikasi Perkembangan
          </h2>
          <div className="grid gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4.5 flex gap-3.5 backdrop-blur-xl shadow-sm",
                  alert.severity === "warning"
                    ? "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-100"
                    : "border-[var(--blue)]/20 bg-[var(--blue)]/5 text-[var(--blue)]",
                )}
              >
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
                    alert.severity === "warning"
                      ? "bg-amber-500"
                      : "bg-gradient-to-br from-[var(--blue)] to-[var(--teal)]",
                  )}
                >
                  {alert.type === "inactivity" ? (
                    <Calendar size={15} strokeWidth={2.5} />
                  ) : alert.type === "struggle" ? (
                    <Brain size={15} strokeWidth={2.5} />
                  ) : (
                    <Sparkles size={15} strokeWidth={2.5} />
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-[13px] font-bold tracking-tight">
                    {alert.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-muted-foreground max-w-2xl">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CORE METRICS OVERVIEW ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        {/* Streak Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-muted-foreground">
              Streak Belajar
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Flame size={16} fill="currentColor" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-heading text-[32px] font-extrabold leading-none text-foreground">
              {summary.streak.current}
            </span>
            <span className="text-[12px] font-medium text-muted-foreground">
              hari berturut-turut
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed">
            Streak terlama yang pernah dicapai: **{summary.streak.longest}{" "}
            hari**.
          </p>
        </div>

        {/* Level / XP Progress Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-muted-foreground">
              Level Belajar
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--blue)]/10 text-[var(--blue)]">
              <Award size={16} strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="font-heading text-[30px] font-extrabold leading-none text-foreground">
              Level {summary.level.level}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--blue)] ml-1">
              {summary.level.name}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Progress
              value={summary.level.progress}
              className="h-2 rounded-full"
            />
            <div className="flex justify-between text-[9.5px] font-bold text-muted-foreground">
              <span>{summary.level.totalXp} XP</span>
              {summary.level.xpToNext ? (
                <span>{summary.level.xpToNext} XP ke Level Berikutnya</span>
              ) : (
                <span>Tingkat Maksimum</span>
              )}
            </div>
          </div>
        </div>

        {/* Overall Activity Score Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-card/90">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-muted-foreground">
              Skor Keaktifan Mingguan
            </span>
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--teal)]/10 text-[var(--teal)]">
              <Target size={16} strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-heading text-[32px] font-extrabold leading-none text-foreground">
              {timeline && timeline.points.length > 0
                ? Math.round(
                    timeline.points.reduce(
                      (acc, p) => acc + p.overallScore,
                      0,
                    ) / timeline.points.length,
                  )
                : 0}
            </span>
            <span className="text-[12px] font-medium text-muted-foreground">
              / 100 poin
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed">
            Dihitung otomatis berdasarkan penguasaan konsep, tantangan harian,
            dan refleksi.
          </p>
        </div>
      </section>

      {/* ── WEEKLY ACTIVITY TIMELINE ── */}
      {timeline && timeline.points.length > 0 && (
        <section className="rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6 space-y-6">
          <header>
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              Aktivitas Belajar 7 Hari Terakhir
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Tren keaktifan harian dan rincian pengerjaan tantangan oleh{" "}
              {activeChild.name}.
            </p>
          </header>

          <div className="bg-background/25 rounded-2xl border border-border/20 p-3 sm:p-4">
            <WeeklyChart points={timeline.points} />
          </div>

          <div className="space-y-3">
            <h3 className="text-[12px] font-bold text-foreground/80">
              Rincian Aktivitas Harian
            </h3>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {timeline.points.slice(-7).map((pt) => (
                <div
                  key={pt.date}
                  className="flex flex-col items-center rounded-2xl border border-border/30 bg-background/45 p-2 sm:p-3 transition-colors hover:bg-background/80"
                >
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {getDayName(pt.date)}
                  </span>

                  {/* Visual score ring */}
                  <div className="relative my-3 flex size-10 items-center justify-center sm:size-12">
                    <svg className="absolute size-full -rotate-90">
                      <title>Skor Keaktifan Harian</title>
                      <circle
                        cx="50%"
                        cy="50%"
                        r="16"
                        className="stroke-muted/30 fill-none"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="16"
                        className="stroke-[var(--blue)] fill-none transition-all duration-500"
                        strokeWidth="3.5"
                        strokeDasharray="100.5"
                        strokeDashoffset={
                          100.5 - (pt.overallScore / 100) * 100.5
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[11px] font-bold tabular-nums text-foreground">
                      {pt.overallScore}
                    </span>
                  </div>

                  {/* Sub-scores icons indicating completions */}
                  <div className="flex gap-1">
                    <span
                      title="Soal Harian"
                      className={cn(
                        "size-1.5 rounded-full",
                        pt.challengeScore > 0
                          ? "bg-[var(--blue)]"
                          : "bg-muted/40",
                      )}
                    />
                    <span
                      title="Materi Baca"
                      className={cn(
                        "size-1.5 rounded-full",
                        pt.materialsScore > 0
                          ? "bg-[var(--yellow)]"
                          : "bg-muted/40",
                      )}
                    />
                    <span
                      title="Refleksi Diri"
                      className={cn(
                        "size-1.5 rounded-full",
                        pt.reflectionsScore > 0
                          ? "bg-[var(--coral)]"
                          : "bg-muted/40",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 border-t border-border/20 pt-3 text-[10.5px] text-muted-foreground font-semibold">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[var(--blue)]" /> Soal
                Terjawab
              </div>
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[var(--yellow)]" />{" "}
                Materi Dibaca
              </div>
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[var(--coral)]" />{" "}
                Refleksi Terkirim
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SUBJECT PROGRESS REPORT & CONCEPTS ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Subject Progress */}
        <section className="space-y-4 md:col-span-7 rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6">
          <header>
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              Mata Pelajaran yang Sedang Dipelajari
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Tingkat penguasaan anak Anda berdasarkan pengerjaan materi dan
              kuis latihan.
            </p>
          </header>

          <div className="space-y-4.5 mt-4">
            {summary.subjects.map((sub) => (
              <div key={sub.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-7 place-items-center rounded-lg text-white font-bold text-[12px]"
                      style={{
                        background:
                          sub.color ||
                          "linear-gradient(135deg, var(--blue), var(--teal))",
                      }}
                    >
                      {sub.icon ? sub.icon[0] : sub.name[0]}
                    </span>
                    <span className="text-[13px] font-bold text-foreground leading-none">
                      {sub.name}
                    </span>
                  </div>
                  <span className="text-[12.5px] font-bold text-foreground">
                    {sub.masteryPct}%
                  </span>
                </div>
                <Progress value={sub.masteryPct} className="h-2 rounded-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>
                    {sub.masteredConcepts} / {sub.totalConcepts} Konsep Tuntas
                  </span>
                  <span>{sub.attemptCount} Pertanyaan Terjawab</span>
                </div>
              </div>
            ))}

            {summary.subjects.length === 0 && (
              <p className="text-center text-[12.5px] text-muted-foreground py-6">
                Belum ada mata pelajaran yang difokuskan saat ini.
              </p>
            )}
          </div>
        </section>

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

      {/* ── AI SPARK RECOMMENDATION ── */}
      {aiRecommendation && (
        <section className="relative overflow-hidden rounded-3xl border border-[var(--blue)]/20 bg-gradient-to-br from-[var(--blue)]/5 via-transparent to-[var(--teal)]/5 p-6 shadow-md backdrop-blur-xl sm:p-8">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
            <Sparkles size={260} className="text-[var(--blue)] animate-pulse" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start relative">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_6px_20px_rgba(20,184,166,0.18)]">
              <Lightbulb size={22} className="animate-bounce" />
            </div>

            <div className="space-y-3 min-w-0">
              <div>
                <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[var(--blue)]">
                  Rekomendasi AI Spark
                </span>
                <h2 className="font-heading text-[18px] font-extrabold leading-tight text-foreground sm:text-[20px] mt-0.5">
                  Tips Dukungan Orang Tua
                </h2>
              </div>
              <div
                className="text-[13.5px] leading-relaxed text-muted-foreground space-y-3.5 pt-1
                  [&>p]:leading-relaxed [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc
                  [&_strong]:text-foreground [&_strong]:font-bold"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: AI recommendation text contains safe formatted HTML
                dangerouslySetInnerHTML={{
                  __html: aiRecommendation
                    .replace(/\n\n/g, "<br/><br/>")
                    .replace(/\n/g, "<br/>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/•\s*(.*?)(<br\/>|$)/g, "<li>$1</li>")
                    .replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>")
                    // Clean up nested consecutive uls
                    .replace(/<\/ul>\s*<ul>/g, ""),
                }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
