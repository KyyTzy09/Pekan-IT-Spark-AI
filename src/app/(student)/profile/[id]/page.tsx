import {
  ArrowLeft,
  Award,
  Calendar,
  Flame,
  Lock,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { StudentProfileChart } from "@/components/student/student-profile-chart";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: `${user?.name || "Profil Teman"} — Spark AI`,
    description: `Statistik belajar dan pencapaian teman Spark AI kamu.`,
  };
}

const BADGE_MAP: Record<string, { emoji: string; gradient: string }> = {
  "Penakluk Trigonometri": {
    emoji: "📐",
    gradient: "from-blue-500 to-cyan-400",
  },
  "Teman Aljabar": { emoji: "🧮", gradient: "from-indigo-500 to-blue-400" },
  "Penjelajah Tata Bahasa": {
    emoji: "✍️",
    gradient: "from-amber-500 to-orange-400",
  },
  "Grammar Hero": { emoji: "🔤", gradient: "from-pink-500 to-rose-400" },
  "Ilmuwan Cilik": { emoji: "🧪", gradient: "from-emerald-500 to-teal-400" },
  "Streak Master 7 Hari": {
    emoji: "🔥",
    gradient: "from-orange-600 to-amber-500",
  },
  "Konsisten 30 Hari": {
    emoji: "👑",
    gradient: "from-yellow-500 to-amber-400",
  },
  "Pagi yang Produktif": { emoji: "🌅", gradient: "from-sky-500 to-blue-400" },
  "Penanya Ulung": { emoji: "💬", gradient: "from-purple-500 to-indigo-400" },
  "Pemikir Kritis": { emoji: "🧠", gradient: "from-violet-500 to-purple-400" },
  "Pantang Menyerah": { emoji: "💪", gradient: "from-red-500 to-orange-400" },
};

export default async function UserProfileDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Fetch user details and related records
  const profileUser = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: true,
      streak: true,
      userBadges: {
        include: { badge: true },
      },
      xpTransactions: {
        orderBy: { createdAt: "desc" },
        take: 300,
      },
      questionAttempts: {
        orderBy: { createdAt: "desc" },
        take: 300,
      },
    },
  });

  if (!profileUser || !profileUser.studentProfile) {
    notFound();
  }

  const student = profileUser.studentProfile;
  const levelVal = student.level;

  // Calculate Level Name (similar to dashboard summary logic)
  const LEVEL_NAMES = [
    "Pemula",
    "Pekerja Keras",
    "Cendekiawan",
    "Master",
    "Legenda",
  ];
  const levelName =
    LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor(levelVal / 5))] ||
    "Pemula";

  // Calculate Streak
  const currentStreak = profileUser.streak?.currentStreak ?? 0;

  // Accuracy and Answer Stats
  const totalAttempts = profileUser.questionAttempts.length;
  const correctAttempts = profileUser.questionAttempts.filter(
    (a) => a.isCorrect,
  ).length;
  const accuracyRate =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Badge unlock helper
  const allBadges = await prisma.badge
    .findMany({ orderBy: { xpReward: "asc" } })
    .catch(() => []);
  const ownedBadgeIds = new Set(profileUser.userBadges.map((ub) => ub.badgeId));

  // Group transactions by date YYYY-MM-DD
  const dailyXp: Record<string, number> = {};
  for (const tx of profileUser.xpTransactions) {
    const dateStr = tx.createdAt.toISOString().split("T")[0];
    dailyXp[dateStr] = (dailyXp[dateStr] || 0) + tx.amount;
  }

  // Calculate most active day name
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
  for (const tx of profileUser.xpTransactions) {
    const dayIdx = tx.createdAt.getDay();
    dayCounts[dayIdx] += tx.amount;
  }
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  let maxDayIdx = 1;
  let maxDayVal = -1;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > maxDayVal) {
      maxDayVal = dayCounts[i];
      maxDayIdx = i;
    }
  }
  const mostActiveDayName = maxDayVal > 0 ? dayNames[maxDayIdx] : "Senin";

  // Calculate average daily XP per active day
  const activeDaysCount = Object.keys(dailyXp).length;
  const totalXpEarned = profileUser.xpTransactions.reduce(
    (acc, tx) => acc + tx.amount,
    0,
  );
  const avgXpPerActiveDay =
    activeDaysCount > 0 ? Math.round(totalXpEarned / activeDaysCount) : 0;

  // Generate heatmap calendar data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12); // 12 Months (1 Year) to fill the width

  const dateList: Date[] = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    dateList.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const firstDayIndex = dateList[0].getDay();
  for (let i = 0; i < firstDayIndex; i++) {
    const dummy = new Date(dateList[0]);
    dummy.setDate(dummy.getDate() - (firstDayIndex - i));
    currentWeek.push(dummy);
  }

  for (const day of dateList) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const dummy = new Date(currentWeek[currentWeek.length - 1]);
      dummy.setDate(dummy.getDate() + 1);
      currentWeek.push(dummy);
    }
    weeks.push(currentWeek);
  }

  // Generate 14-day chart progress data
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
    chartData.push({
      date: dateStr,
      label: dayLabel,
      xp: dailyXp[dateStr] || 0,
    });
  }

  // Avatar initials / fallback
  const initial = profileUser.name
    ? profileUser.name.trim().charAt(0).toUpperCase()
    : "?";
  const charCodeSum = profileUser.name
    ? Array.from(profileUser.name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : 0;
  const gradients = [
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-cyan-500 via-teal-500 to-emerald-500",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-pink-500 via-rose-500 to-red-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
    "from-violet-500 via-purple-500 to-indigo-500",
  ];
  const gradientClass = gradients[charCodeSum % gradients.length];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── BACK BUTTON ── */}
      <div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali ke Klasemen
        </Link>
      </div>

      {/* ── PROFILE HERO SECTION ── */}
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.18 25 / 0.55), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Profile Avatar */}
              {profileUser.image ? (
                // biome-ignore lint/performance/noImgElement: Using external image URLs
                <img
                  src={profileUser.image}
                  alt={profileUser.name || "Foto Profil"}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover border border-border/20 shadow-md shrink-0"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center font-extrabold text-white text-4xl shadow-lg bg-gradient-to-br border border-white/10 shrink-0 rounded-3xl",
                    gradientClass,
                  )}
                >
                  {initial}
                </div>
              )}

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/50 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  <Award size={10} strokeWidth={2.5} />
                  Profil Belajar Teman
                </span>
                <h1 className="mt-2 font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
                  {profileUser.name}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1 font-medium">
                  {student.school || "Siswa Spark"}
                  {student.grade && ` • Kelas ${student.grade}`}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-teal-500/8 border border-teal-500/15 px-3 py-1 text-[11px] font-bold text-teal-600">
                    <Sparkles size={11} />
                    Level {levelVal} • {levelName}
                  </span>
                  {currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-orange-500/8 border border-orange-500/15 px-3 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      <Flame
                        size={11}
                        className="fill-orange-500 stroke-orange-500"
                      />
                      {currentStreak} Hari Streak
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-t border-border/20 pt-4 sm:border-t-0 sm:pt-0 text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total XP Diperoleh
              </p>
              <p className="font-heading text-[36px] font-extrabold text-foreground leading-none mt-1 text-gradient-cool">
                {student.totalXp.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                Gaya Belajar: {student.learningStyle || "VISUAL"}
              </p>
            </div>
          </div>
        </header>
      </Reveal>

      {/* ── STATS HIGHLIGHTS ── */}
      <Reveal delay={20}>
        <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Level
            </p>
            <p className="mt-1 font-heading text-[20px] font-bold text-foreground">
              {levelVal}
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Pertanyaan
            </p>
            <p className="mt-1 font-heading text-[20px] font-bold text-foreground">
              {totalAttempts}
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Akurasi Jawaban
            </p>
            <p className="mt-1 font-heading text-[20px] font-bold text-foreground text-emerald-600 dark:text-emerald-400">
              {accuracyRate}%
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Lencana Unlocked
            </p>
            <p className="mt-1 font-heading text-[20px] font-bold text-foreground">
              {profileUser.userBadges.length} / {allBadges.length}
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── HEATMAP & PROGRESS GRAPH ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Heatmap and Graph */}
        <div className="space-y-6 md:col-span-8">
          {/* Calendar Heatmap */}
          <Reveal delay={40}>
            <section className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                <Calendar size={16} className="text-muted-foreground" />
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Kontribusi Belajar (1 Tahun Terakhir)
                </h3>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side: Heatmap (scrollable) */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="w-full overflow-hidden">
                    <div className="overflow-x-auto pb-2 custom-scrollbar min-w-full">
                      <div className="relative pt-6 min-w-[850px]">
                        {/* Month labels absolute header bar */}
                        <div className="absolute top-0 left-0 right-0 h-5 flex text-[9px] text-muted-foreground font-bold select-none pointer-events-none">
                          {(() => {
                            const monthNames = [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "Mei",
                              "Jun",
                              "Jul",
                              "Agt",
                              "Sep",
                              "Okt",
                              "Nov",
                              "Des",
                            ];
                            const monthLabels: {
                              weekIndex: number;
                              label: string;
                            }[] = [];
                            let prevMonth = -1;
                            weeks.forEach((week, weekIdx) => {
                              const midDay = week[3];
                              if (midDay) {
                                const m = midDay.getMonth();
                                if (m !== prevMonth) {
                                  monthLabels.push({
                                    weekIndex: weekIdx,
                                    label: monthNames[m],
                                  });
                                  prevMonth = m;
                                }
                              }
                            });

                            return monthLabels.map((ml) => {
                              const leftPx = ml.weekIndex * 16;
                              return (
                                <span
                                  key={`${ml.label}-${ml.weekIndex}`}
                                  className="absolute font-bold tracking-wider text-muted-foreground/80"
                                  style={{ left: `${leftPx}px` }}
                                >
                                  {ml.label}
                                </span>
                              );
                            });
                          })()}
                        </div>

                        {/* Heatmap Columns */}
                        <div className="flex gap-[3px]">
                          {weeks.map((week) => (
                            <div
                              key={week[0].toISOString()}
                              className="flex flex-col gap-[3px] shrink-0"
                            >
                              {week.map((day) => {
                                const dateStr = day.toISOString().split("T")[0];
                                const xp = dailyXp[dateStr] || 0;
                                let colorClass =
                                  "bg-muted/25 dark:bg-slate-800/40";
                                if (xp > 0 && xp <= 50)
                                  colorClass = "bg-emerald-500/20";
                                else if (xp > 50 && xp <= 150)
                                  colorClass = "bg-emerald-500/45";
                                else if (xp > 150 && xp <= 300)
                                  colorClass = "bg-emerald-500/70";
                                else if (xp > 300)
                                  colorClass =
                                    "bg-emerald-600 dark:bg-emerald-500";

                                return (
                                  <div
                                    key={dateStr}
                                    title={`${day.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}: ${xp} XP`}
                                    className={cn(
                                      "size-[13px] rounded-[3px] transition-all cursor-pointer hover:scale-125 hover:z-10",
                                      colorClass,
                                    )}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium pt-3 border-t border-border/5">
                    <span>
                      Total Aktif: {profileUser.xpTransactions.length} kali
                      kegiatan belajar
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>Kurang</span>
                      <div className="size-2.5 rounded-[2px] bg-muted/25 dark:bg-slate-800/40" />
                      <div className="size-2.5 rounded-[2px] bg-emerald-500/20" />
                      <div className="size-2.5 rounded-[2px] bg-emerald-500/45" />
                      <div className="size-2.5 rounded-[2px] bg-emerald-500/70" />
                      <div className="size-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
                      <span>Banyak</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Learning Stats Panel (fills the empty space) */}
                <div className="w-full lg:w-[220px] shrink-0 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-border/10 pt-4 lg:pt-0 lg:pl-5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Statistik Belajar
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                    {/* Stat Item 1 */}
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Flame size={13} className="fill-emerald-500/10" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                          Teraktif
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                          {mostActiveDayName}
                        </p>
                      </div>
                    </div>
                    {/* Stat Item 2 */}
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-[var(--coral)]/10 flex items-center justify-center text-[var(--coral)] shrink-0">
                        <TrendingUp size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                          Rata-rata
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                          {avgXpPerActiveDay} XP/hari
                        </p>
                      </div>
                    </div>
                    {/* Stat Item 3 */}
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <Calendar size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                          Hari Aktif
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                          {activeDaysCount} Hari
                        </p>
                      </div>
                    </div>
                    {/* Stat Item 4 */}
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-2.5 flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Sparkles size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8.5px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                          Total Sesi
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none truncate">
                          {profileUser.xpTransactions.length} Sesi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* XP Progress Trend Chart */}
          <Reveal delay={60}>
            <section className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                <TrendingUp size={16} className="text-muted-foreground" />
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Tren Keaktifan Harian (14 Hari Terakhir)
                </h3>
              </div>
              <StudentProfileChart data={chartData} />
            </section>
          </Reveal>
        </div>

        {/* Right Column: Badges */}
        <div className="space-y-6 md:col-span-4">
          <Reveal delay={80}>
            <section className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur-xl space-y-6">
              <header className="border-b border-border/20 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy size={15} className="text-amber-500" />
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Lencana Teman
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {profileUser.userBadges.length} Unlocked
                </span>
              </header>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {allBadges.map((badge) => {
                  const unlocked = ownedBadgeIds.has(badge.id);
                  const meta = BADGE_MAP[badge.name] || {
                    emoji: "🏆",
                    gradient: "from-[var(--coral)] to-[var(--orange)]",
                  };

                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "flex gap-3.5 p-3 rounded-2xl border transition-all",
                        unlocked
                          ? "border-border bg-card/40"
                          : "border-border/20 bg-muted/10 opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl text-lg shadow-sm",
                          unlocked
                            ? `bg-gradient-to-br ${meta.gradient} text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
                            : "bg-muted text-muted-foreground/30",
                        )}
                      >
                        {unlocked ? (
                          meta.emoji
                        ) : (
                          <Lock size={13} strokeWidth={2.5} />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1 leading-snug">
                        <h4
                          className={cn(
                            "text-xs font-bold truncate",
                            unlocked
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
