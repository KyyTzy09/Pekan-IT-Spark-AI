"use client";

import {
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type LeaderboardUser = {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  school: string | null;
  grade: number | null;
  user: {
    id: string;
    name: string | null;
    avatarCustomization: {
      color: string;
      accessory: string | null;
      background: string | null;
    } | null;
    streak: {
      current: number;
    } | null;
    userBadges: Array<{
      id: string;
      badge: {
        id: string;
        name: string;
        description: string | null;
        xpReward: number;
      };
    }>;
  };
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

export function LeaderboardView({
  leaderboard,
  currentUserId,
}: {
  leaderboard: LeaderboardUser[];
  currentUserId: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] =
    React.useState<LeaderboardUser | null>(null);

  // Filter leaderboard based on search query (name or school)
  const filteredList = React.useMemo(() => {
    return leaderboard.filter((entry) => {
      const nameMatch = entry.user.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const schoolMatch = entry.school
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return nameMatch || schoolMatch;
    });
  }, [leaderboard, searchQuery]);

  // podium mapping: 1st place in center (index 0), 2nd on left (index 1), 3rd on right (index 2)
  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── HEADER ── */}
      <header className="border-b border-border/20 pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
          <Trophy size={10} strokeWidth={2.5} />
          Klasemen Belajar
        </span>
        <h1 className="mt-2 font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
          Papan Juara Spark
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Lihat peringkat ketekunan dan persahabatan belajar siswa Spark AI
          se-Indonesia secara suportif!
        </p>
      </header>

      {/* ── SEARCH BAR ── */}
      <div className="relative flex max-w-md items-center rounded-2xl border border-border/40 bg-card/60 px-3.5 py-2.5 shadow-sm backdrop-blur-md focus-within:border-[var(--coral)] focus-within:ring-3 focus-within:ring-[var(--coral)]/25 transition-all">
        <Search size={16} className="text-muted-foreground mr-2.5 shrink-0" />
        <input
          type="text"
          placeholder="Cari nama atau sekolah siswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/75"
        />
      </div>

      {/* ── PODIUM OF CHAMPIONS (Only shown if no search query) ── */}
      {!searchQuery && leaderboard.length > 0 && (
        <section className="grid gap-6 items-end justify-center py-6 sm:grid-cols-3 max-w-3xl mx-auto">
          {/* Second Place (Left) */}
          {secondPlace && (
            <button
              type="button"
              onClick={() => setSelectedUser(secondPlace)}
              className="group flex flex-col items-center p-5 rounded-3xl border border-border/40 bg-card/45 shadow-sm hover:shadow-md backdrop-blur-xl transition-all order-2 sm:order-1 hover:-translate-y-1 w-full text-center cursor-pointer"
            >
              <div className="relative">
                <span className="absolute -top-3.5 -right-3.5 grid size-7 place-items-center rounded-full bg-slate-300 font-extrabold text-[12px] text-slate-800 border-2 border-background shadow-md">
                  2
                </span>
                <SparkCharacter
                  size="md"
                  color={secondPlace.user.avatarCustomization?.color}
                  accessory={secondPlace.user.avatarCustomization?.accessory}
                  background={secondPlace.user.avatarCustomization?.background}
                />
              </div>
              <h3 className="mt-4 font-heading text-[14px] font-bold text-foreground text-center truncate w-full">
                {secondPlace.user.name?.split(" ")[0]}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate w-full text-center">
                {secondPlace.school || "Siswa Spark"}
              </p>
              <span className="mt-2 text-[12px] font-extrabold text-slate-500">
                {secondPlace.totalXp} XP
              </span>
            </button>
          )}

          {/* First Place (Center - Highlighted) */}
          {firstPlace && (
            <button
              type="button"
              onClick={() => setSelectedUser(firstPlace)}
              className="group flex flex-col items-center p-6 rounded-3xl border border-amber-500/25 bg-amber-500/5 shadow-md hover:shadow-lg backdrop-blur-xl transition-all order-1 sm:order-2 sm:scale-105 hover:-translate-y-1.5 w-full text-center cursor-pointer"
            >
              <div className="relative">
                <span className="absolute -top-4 -right-4 grid size-8 place-items-center rounded-full bg-amber-400 font-extrabold text-[13px] text-amber-950 border-2 border-background shadow-lg animate-bounce">
                  👑
                </span>
                <SparkCharacter
                  size="lg"
                  color={firstPlace.user.avatarCustomization?.color}
                  accessory={firstPlace.user.avatarCustomization?.accessory}
                  background={firstPlace.user.avatarCustomization?.background}
                />
              </div>
              <h3 className="mt-4 font-heading text-[16px] font-extrabold text-foreground text-center truncate w-full">
                {firstPlace.user.name?.split(" ")[0]}
              </h3>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium truncate w-full text-center">
                {firstPlace.school || "Siswa Spark"}
              </p>
              <span className="mt-2.5 text-[14px] font-extrabold text-amber-600 dark:text-amber-400">
                {firstPlace.totalXp} XP
              </span>
            </button>
          )}

          {/* Third Place (Right) */}
          {thirdPlace && (
            <button
              type="button"
              onClick={() => setSelectedUser(thirdPlace)}
              className="group flex flex-col items-center p-5 rounded-3xl border border-border/40 bg-card/45 shadow-sm hover:shadow-md backdrop-blur-xl transition-all order-3 hover:-translate-y-1 w-full text-center cursor-pointer"
            >
              <div className="relative">
                <span className="absolute -top-3.5 -right-3.5 grid size-7 place-items-center rounded-full bg-amber-700/70 font-extrabold text-[12px] text-white border-2 border-background shadow-md">
                  3
                </span>
                <SparkCharacter
                  size="md"
                  color={thirdPlace.user.avatarCustomization?.color}
                  accessory={thirdPlace.user.avatarCustomization?.accessory}
                  background={thirdPlace.user.avatarCustomization?.background}
                />
              </div>
              <h3 className="mt-4 font-heading text-[14px] font-bold text-foreground text-center truncate w-full">
                {thirdPlace.user.name?.split(" ")[0]}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate w-full text-center">
                {thirdPlace.school || "Siswa Spark"}
              </p>
              <span className="mt-2 text-[12px] font-extrabold text-amber-800 dark:text-amber-600">
                {thirdPlace.totalXp} XP
              </span>
            </button>
          )}
        </section>
      )}

      {/* ── LEADERBOARD LIST ── */}
      <section className="rounded-3xl border border-border/40 bg-card/50 p-4 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl sm:p-6">
        <h2 className="font-heading text-[14px] font-bold text-foreground mb-4 uppercase tracking-wider">
          Peringkat Klasemen
        </h2>
        <div className="divide-y divide-border/20">
          {filteredList.map((entry) => {
            const rank = leaderboard.findIndex((e) => e.id === entry.id) + 1;
            const isSelf = entry.user.id === currentUserId;

            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => setSelectedUser(entry)}
                className={cn(
                  "flex items-center gap-3.5 py-3.5 px-3 rounded-2xl cursor-pointer transition-all hover:bg-muted/40 w-full text-left",
                  isSelf &&
                    "bg-[var(--coral)]/8 border border-[var(--coral)]/20 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.1)] hover:bg-[var(--coral)]/12",
                )}
              >
                {/* Rank number badge */}
                <div
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-xl font-extrabold text-[12px]",
                    rank === 1
                      ? "bg-amber-400 text-amber-950 shadow-sm"
                      : rank === 2
                        ? "bg-slate-300 text-slate-800 shadow-sm"
                        : rank === 3
                          ? "bg-amber-700/80 text-white shadow-sm"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {rank}
                </div>

                {/* Avatar character preview */}
                <div className="shrink-0">
                  <SparkCharacter
                    size="sm"
                    color={entry.user.avatarCustomization?.color}
                    accessory={entry.user.avatarCustomization?.accessory}
                    background={entry.user.avatarCustomization?.background}
                  />
                </div>

                {/* Name & School info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-[13.5px] font-bold text-foreground truncate">
                      {entry.user.name ?? "Siswa Anonim"}
                    </span>
                    {isSelf && (
                      <span className="rounded-md bg-[var(--coral)]/10 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-widest text-[var(--coral)] shrink-0">
                        Kamu
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {entry.school || "Siswa Spark"}{" "}
                    {entry.grade && `• Kelas ${entry.grade}`}
                  </p>
                </div>

                {/* Streak count */}
                {entry.user.streak && entry.user.streak.current > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/5 border border-orange-500/10 px-2 py-0.5 rounded-lg shrink-0">
                    <Flame
                      size={10}
                      className="fill-orange-500 stroke-orange-500"
                    />
                    <span>{entry.user.streak.current} Hari</span>
                  </div>
                )}

                {/* Level badge */}
                <span className="rounded-lg bg-muted/70 px-2 py-0.5 text-[10.5px] font-bold text-foreground/80 shrink-0">
                  Lv. {entry.level}
                </span>

                {/* XP Score */}
                <div className="text-right shrink-0 min-w-16">
                  <p className="text-[13px] font-extrabold text-foreground">
                    {entry.totalXp}
                  </p>
                  <p className="text-[8.5px] font-bold uppercase tracking-widest text-muted-foreground">
                    XP
                  </p>
                </div>

                <ChevronRight
                  size={14}
                  className="text-muted-foreground/40 shrink-0"
                />
              </button>
            );
          })}

          {filteredList.length === 0 && (
            <p className="text-center text-[12.5px] text-muted-foreground py-8">
              Tidak ada siswa yang cocok dengan pencarianmu.
            </p>
          )}
        </div>
      </section>

      {/* ── USER DETAIL MODAL ── */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        {selectedUser && (
          <DialogContent className="max-w-md rounded-3xl p-5 overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="font-heading text-base font-bold text-center">
                Profil Teman Spark
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Mascot Portrait glow */}
              <div className="relative flex items-center justify-center p-4 rounded-3xl bg-muted/20 border border-border/20 backdrop-blur-md size-28 sm:size-32">
                <SparkCharacter
                  size="lg"
                  color={selectedUser.user.avatarCustomization?.color}
                  accessory={selectedUser.user.avatarCustomization?.accessory}
                  background={selectedUser.user.avatarCustomization?.background}
                />
              </div>

              {/* Student details */}
              <div className="text-center space-y-1">
                <h3 className="font-heading text-[18px] font-extrabold text-foreground">
                  {selectedUser.user.name}
                </h3>
                <p className="text-[12.5px] text-muted-foreground font-medium">
                  {selectedUser.school || "Siswa Spark"}{" "}
                  {selectedUser.grade && `• Kelas ${selectedUser.grade}`}
                </p>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-2 gap-3 w-full border-t border-b border-border/20 py-4 my-2 text-center">
                <div className="border-r border-border/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Level Belajar
                  </p>
                  <p className="font-heading text-[22px] font-extrabold text-foreground mt-1 flex items-center justify-center gap-1">
                    <Award size={16} className="text-[var(--coral)]" />
                    Level {selectedUser.level}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Total XP
                  </p>
                  <p className="font-heading text-[22px] font-extrabold text-[var(--teal)] mt-1 flex items-center justify-center gap-1">
                    <Sparkles size={14} />
                    {selectedUser.totalXp} XP
                  </p>
                </div>
              </div>

              {/* Badges container */}
              <div className="w-full space-y-3">
                <h4 className="font-heading text-[12px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} className="text-muted-foreground" />
                  Lencana Diperoleh ({selectedUser.user.userBadges.length})
                </h4>

                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedUser.user.userBadges.map((ub) => {
                    const meta = BADGE_MAP[ub.badge.name] || {
                      emoji: "🏆",
                      gradient: "from-[var(--coral)] to-[var(--orange)]",
                    };
                    return (
                      <div
                        key={ub.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 bg-background/50 text-left"
                      >
                        <span
                          className={`grid size-9 place-items-center rounded-lg text-lg bg-gradient-to-br ${meta.gradient} text-white shadow-sm shrink-0`}
                        >
                          {meta.emoji}
                        </span>
                        <div className="min-w-0 flex-1 leading-snug">
                          <p className="text-xs font-bold text-foreground truncate">
                            {ub.badge.name}
                          </p>
                          <p className="text-[9.5px] text-muted-foreground truncate">
                            {ub.badge.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {selectedUser.user.userBadges.length === 0 && (
                    <p className="text-center text-[11px] text-muted-foreground italic py-4">
                      Belum ada lencana yang terbuka saat ini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
