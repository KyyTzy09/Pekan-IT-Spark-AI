import {
  ArrowRight,
  Flame,
  Lock,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { AvatarUpload } from "@/components/student/avatar-upload";
import { ProfileForm } from "@/components/student/profile-form";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const metadata: Metadata = {
  title: "Profil & Avatar Saya — Spark AI",
  description:
    "Dandani maskot Spark kamu dan pantau pertumbuhan tanaman virtualmu di sini.",
};

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

export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  const userId = session.id;

  const [summary, _avatarRaw, allBadges, userBadges, userData] =
    await Promise.all([
      getDashboardSummary(userId).catch(() => ({
        student: {
          id: userId,
          name: "",
          grade: null,
          school: null,
          learningStyle: null,
        },
        greeting: "Halo!",
        greetingSubtitle: "",
        sparkTip: "",
        streak: { current: 0, longest: 0, freezeAvailable: 0 },
        level: {
          level: 1,
          name: "Pemula",
          totalXp: 0,
          currentMinXp: 0,
          nextMinXp: null,
          progress: 0,
          xpToNext: null,
        },
        subjects: [],
        totalMastered: 0,
        totalConcepts: 0,
        totalAttempts: 0,
        recommendation: null,
        recentDocuments: 0,
      })),
      prisma.avatarCustomization
        .findUnique({ where: { userId } })
        .catch(() => null),
      prisma.badge.findMany({ orderBy: { xpReward: "asc" } }).catch(() => []),
      prisma.userBadge.findMany({ where: { userId } }).catch(() => []),
      prisma.user
        .findUnique({
          where: { id: userId },
          select: { image: true },
        })
        .catch(() => null),
    ]);

  const ownedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
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
              {/* Profile Photo */}
              <AvatarUpload
                currentImage={userData?.image ?? null}
                userName={summary.student.name || "Siswa Spark"}
              />

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  <UserCheck size={10} strokeWidth={2.5} />
                  Kartu Siswa
                </span>
                <h1 className="mt-2 font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
                  {summary.student.name}
                </h1>
                <p className="text-[13px] text-muted-foreground mt-1 font-medium">
                  {summary.student.school || "Siswa Spark"}
                  {summary.student.grade && ` • Kelas ${summary.student.grade}`}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-[var(--coral)]/8 border border-[var(--coral)]/15 px-3 py-1 text-[11px] font-bold text-[var(--coral)]">
                    <Sparkles size={11} />
                    {summary.level.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/8 border border-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Flame
                      size={11}
                      className="fill-amber-500 stroke-amber-500"
                    />
                    {summary.streak.current} Hari Streak
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-t border-border/20 pt-4 sm:border-t-0 sm:pt-0 text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total XP Kamu
              </p>
              <p className="font-heading text-[36px] font-extrabold text-foreground leading-none mt-1 text-gradient-cool">
                {summary.level.totalXp}
              </p>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                Level {summary.level.level} •{" "}
                {summary.level.xpToNext
                  ? `${summary.level.xpToNext} XP ke level berikutnya`
                  : "Level Maksimal"}
              </p>
            </div>
          </div>
        </header>
      </Reveal>

      {/* ── COLUMN LAYOUT ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Customizers & Forms */}
        <div className="space-y-6 md:col-span-6">
          {/* Tree Link Card */}
          <Reveal delay={60}>
            <Link href="/tree">
              <div className="group relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl transition-all hover:shadow-lg hover:border-emerald-500/30">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
                    🌳
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      Pohon Kehidupan
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Lihat pertumbuhan pohonmu dalam 3D
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:text-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Profile Form */}
          <Reveal delay={80}>
            <section className="rounded-3xl border border-border/40 bg-card/65 p-5 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl sm:p-6 space-y-4">
              <header className="border-b border-border/20 pb-3">
                <h3 className="font-heading text-[16px] font-bold text-foreground">
                  Pengaturan Akun
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  Ubah informasi sekolah dan gaya belajarmu di bawah ini.
                </p>
              </header>
              <ProfileForm
                initialName={summary.student.name || ""}
                initialSchool={summary.student.school || ""}
                initialGrade={summary.student.grade || 10}
                initialLearningStyle={summary.student.learningStyle || "VISUAL"}
              />
            </section>
          </Reveal>
        </div>

        {/* Right Column: Achievements & Badges */}
        <div className="space-y-6 md:col-span-6">
          <Reveal delay={100}>
            <section className="rounded-3xl border border-border/40 bg-card/50 p-5 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl sm:p-6 space-y-6">
              <header className="border-b border-border/20 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-[16px] font-bold text-foreground">
                    Koleksi Lencana
                  </h3>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    Raih tantangan belajar untuk membuka lencana baru!
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-tr from-[var(--coral)] to-[var(--orange)] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                  <Trophy size={11} />
                  {userBadges.length} / {allBadges.length}
                </span>
              </header>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {allBadges.map((badge) => {
                  const unlocked = ownedBadgeIds.has(badge.id);
                  const meta = BADGE_MAP[badge.name] || {
                    emoji: "🏆",
                    gradient: "from-[var(--coral)] to-[var(--orange)]",
                  };
                  const userBadgeInfo = userBadges.find(
                    (ub) => ub.badgeId === badge.id,
                  );

                  return (
                    <div
                      key={badge.id}
                      className={`flex gap-4 p-3.5 rounded-2xl border transition-all ${
                        unlocked
                          ? "border-border bg-card/65 hover:bg-card"
                          : "border-border/30 bg-muted/20 opacity-70"
                      }`}
                    >
                      {/* Badge Icon Grid */}
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-sm ${
                          unlocked
                            ? `bg-gradient-to-br ${meta.gradient} text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]`
                            : "bg-muted text-muted-foreground/40"
                        }`}
                      >
                        {unlocked ? (
                          meta.emoji
                        ) : (
                          <Lock size={16} strokeWidth={2.5} />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4
                            className={`text-[13px] font-bold truncate leading-tight ${
                              unlocked
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {badge.name}
                          </h4>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
                            +{badge.xpReward} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {badge.description}
                        </p>
                        {unlocked && userBadgeInfo && (
                          <p className="text-[9px] font-semibold text-[var(--coral)] mt-1">
                            Lencana diperoleh pada{" "}
                            {formattedDate(userBadgeInfo.earnedAt)}
                          </p>
                        )}
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
