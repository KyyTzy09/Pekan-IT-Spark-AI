"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Brain,
  Calendar,
  Flame,
  Heart,
  Home,
  LogOut,
  type LucideIcon,
  Menu,
  MessageCircle,
  Sparkles,
  TreePine,
  Trophy,
  Upload,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/use-session";
import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type NavProfileData = {
  name: string | null;
  school: string | null;
  grade: number | null;
  levelName: string;
  levelLevel: number;
  totalXp: number;
  xpToNext: number | null;
  progress: number;
  streak: number;
};

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: "Utama",
    items: [
      {
        href: "/dashboard",
        label: "Beranda",
        shortLabel: "Beranda",
        icon: Home,
        match: (p) => p === "/dashboard",
      },
      {
        href: "/chat",
        label: "Tanya Spark",
        shortLabel: "Tanya",
        icon: MessageCircle,
        match: (p) => p.startsWith("/chat"),
      },
      {
        href: "/challenge",
        label: "Tantangan",
        shortLabel: "Tantangan",
        icon: Sparkles,
        match: (p) => p.startsWith("/challenge"),
      },
      {
        href: "/activity",
        label: "Aktivitas",
        shortLabel: "Aktivitas",
        icon: Activity,
        match: (p) => p.startsWith("/activity"),
      },
      {
        href: "/leaderboard",
        label: "Leaderboard",
        shortLabel: "Leaderboard",
        icon: Trophy,
        match: (p) => p.startsWith("/leaderboard"),
      },
      {
        href: "/tree",
        label: "Pohon Kehidupan",
        shortLabel: "Pohon",
        icon: TreePine,
        match: (p) => p.startsWith("/tree"),
      },
    ],
  },
  {
    title: "Pembelajaran",
    items: [
      {
        href: "/subjects",
        label: "Mata Pelajaran",
        shortLabel: "Mapel",
        icon: BookOpen,
        match: (p) => p.startsWith("/subjects") || p.startsWith("/topics"),
      },
      {
        href: "/materials",
        label: "Materi Belajar",
        shortLabel: "Materi",
        icon: Calendar,
        match: (p) => p.startsWith("/materials"),
      },
      {
        href: "/practice",
        label: "Latihan Soal",
        shortLabel: "Latihan",
        icon: Brain,
        match: (p) => p.startsWith("/practice"),
      },
    ],
  },
  {
    title: "Alat & Pengaturan",
    items: [
      {
        href: "/profile",
        label: "Profil & Avatar",
        shortLabel: "Profil",
        icon: User,
        match: (p) => p.startsWith("/profile"),
      },
      {
        href: "/upload",
        label: "Upload Dokumen",
        shortLabel: "Upload",
        icon: Upload,
        match: (p) => p.startsWith("/upload") || p.startsWith("/documents"),
      },
      {
        href: "/settings/invite",
        label: "Pantauan Orang Tua",
        shortLabel: "Orang Tua",
        icon: Heart,
        match: (p) => p.startsWith("/settings/invite"),
      },
    ],
  },
];

// Profile Widget Fallback (Unauthenticated / Error)
function ProfileWidgetFallback() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/45 p-3.5 shadow-sm backdrop-blur-md">
      <div className="relative flex items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground shadow-sm">
          SA
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">
            Siswa Spark
          </p>
          <p className="text-[10px] text-muted-foreground">Selamat belajar!</p>
        </div>
      </div>
    </div>
  );
}

// Profile Widget
function ProfileWidget({ data }: { data: NavProfileData | null }) {
  if (!data) return <ProfileWidgetFallback />;

  const name = data.name || "Siswa";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const streak = data.streak;

  return (
    <Link
      href="/profile"
      className="block relative overflow-hidden rounded-2xl border border-border/50 bg-card/45 p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md hover:bg-card/70 hover:border-[var(--coral)]/30 transition-all group"
    >
      {/* Background neon glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-[var(--coral)]/10 blur-xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-6 size-16 rounded-full bg-[var(--purple)]/10 blur-xl"
      />

      <div className="relative flex items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--coral)] to-[var(--orange)] text-xs font-bold text-white shadow-sm">
          {initials}
          {streak > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white ring-1 ring-background animate-pulse">
              🔥
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground truncate">
              {data.school || "Siswa Spark"}
            </span>
            {data.grade && (
              <>
                <span className="size-1 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                  Kelas {data.grade}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className="text-[var(--coral)] flex items-center gap-1">
            <Sparkles size={10} className="animate-pulse" />
            {data.levelName}
          </span>
          <span className="text-muted-foreground">{data.totalXp} XP</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] transition-all duration-500"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-medium text-muted-foreground">
          <span>Lv. {data.levelLevel}</span>
          {data.xpToNext ? (
            <span>
              {data.xpToNext} XP ke Lv. {data.levelLevel + 1}
            </span>
          ) : (
            <span>Level Maksimal</span>
          )}
        </div>
      </div>

      {streak > 0 && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-amber-500/5 px-2 py-1 border border-amber-500/10">
          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Flame
              size={10}
              className="fill-amber-500 stroke-amber-500 animate-pulse"
            />
            Streak Harian
          </span>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
            {streak} Hari
          </span>
        </div>
      )}
    </Link>
  );
}

export const StudentNav = memo(function StudentNav({
  variant = "sidebar",
  className,
  profileData = null,
}: {
  variant?: "sidebar" | "bottom";
  className?: string;
  profileData?: NavProfileData | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Flat list of navigation items for quick lookup
  const flatItems = useMemo(() => SECTIONS.flatMap((s) => s.items), []);

  // Bottom Navigation has 4 primary buttons + 1 "Lainnya" button
  const bottomNavItems = useMemo(
    () =>
      [
        flatItems.find((item) => item.href === "/dashboard"),
        flatItems.find((item) => item.href === "/chat"),
        flatItems.find((item) => item.href === "/challenge"),
        flatItems.find((item) => item.href === "/practice"),
      ].filter(Boolean) as NavItem[],
    [flatItems],
  );

  // Drawer has secondary navigation items
  const drawerItems = useMemo(
    () =>
      [
        flatItems.find((item) => item.href === "/profile"),
        flatItems.find((item) => item.href === "/leaderboard"),
        flatItems.find((item) => item.href === "/tree"),
        flatItems.find((item) => item.href === "/subjects"),
        flatItems.find((item) => item.href === "/materials"),
        flatItems.find((item) => item.href === "/activity"),
        flatItems.find((item) => item.href === "/upload"),
        flatItems.find((item) => item.href === "/settings/invite"),
      ].filter(Boolean) as NavItem[],
    [flatItems],
  );

  const activeIndex = bottomNavItems.findIndex((item) => item.match(pathname));
  const isDrawerActive = drawerItems.some((item) => item.match(pathname));

  if (variant === "bottom") {
    return (
      <>
        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Navigasi utama"
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/85 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden",
            className,
          )}
        >
          <ul className="mx-auto flex max-w-md items-center justify-between gap-1 py-2">
            {bottomNavItems.map((item, i) => {
              const active = i === activeIndex && !menuOpen;
              const Icon = item.icon;
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] font-bold transition-all",
                      active
                        ? "text-[var(--coral)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-2xl transition-all duration-300",
                        active
                          ? "bg-[var(--coral)]/10 text-[var(--coral)] shadow-sm scale-110"
                          : "bg-transparent group-active:scale-95",
                      )}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.5 : 2}
                        className={cn(
                          "transition-transform",
                          active && "-translate-y-0.5",
                        )}
                      />
                    </span>
                    <span className="leading-none tracking-wide">
                      {item.shortLabel}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="active-indicator-dot"
                        className="absolute top-0 size-1 rounded-full bg-[var(--coral)]"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Menu Lainnya Button */}
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={cn(
                  "w-full group relative flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] font-bold transition-all",
                  menuOpen || isDrawerActive
                    ? "text-[var(--coral)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-2xl transition-all duration-300",
                    menuOpen || isDrawerActive
                      ? "bg-[var(--coral)]/10 text-[var(--coral)] shadow-sm scale-110"
                      : "bg-transparent group-active:scale-95",
                  )}
                >
                  {menuOpen ? (
                    <X
                      size={18}
                      strokeWidth={2.5}
                      className="rotate-90 transition-transform duration-200"
                    />
                  ) : (
                    <Menu
                      size={18}
                      strokeWidth={isDrawerActive ? 2.5 : 2}
                      className="transition-transform duration-200"
                    />
                  )}
                </span>
                <span className="leading-none tracking-wide">Lainnya</span>
                {(menuOpen || isDrawerActive) && (
                  <motion.span
                    layoutId="active-indicator-dot"
                    className="absolute top-0 size-1 rounded-full bg-[var(--coral)]"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
            </li>
          </ul>
        </nav>

        {/* Slide-up Sheet Drawer for Mobile */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden"
              />

              {/* Sheet content */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] border-t border-border/40 bg-card/95 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl md:hidden"
              >
                {/* Drag handle */}
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Menu Lainnya
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-muted/60 p-1 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Active user status inside the drawer */}
                <div className="mb-5">
                  <ProfileWidget data={profileData} />
                </div>

                {/* Secondary navigation grid */}
                <div className="grid grid-cols-2 gap-3">
                  {drawerItems.map((item) => {
                    const active = item.match(pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                          active
                            ? "border-[var(--coral)]/30 bg-[var(--coral)]/5 text-[var(--coral)]"
                            : "border-border/50 bg-card/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-10 place-items-center rounded-xl transition-all duration-300",
                            active
                              ? "bg-[var(--coral)] text-white shadow-sm"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                        </span>
                        <span className="text-[11px] font-bold leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="col-span-2 relative flex items-center justify-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all p-4 text-center text-red-500 font-bold cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span className="text-[11.5px]">Keluar Akun</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn("flex flex-col h-full gap-5", className)}
    >
      {/* Brand Logo Header */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 rounded-2xl px-2 py-1 transition-transform hover:scale-[1.02]"
      >
        <span className="relative grid size-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.3)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
          />
          <Flame
            size={20}
            strokeWidth={2.5}
            className="relative animate-pulse"
          />
        </span>
        <div className="flex flex-col">
          <span className="font-heading text-[16px] font-extrabold leading-none tracking-tight text-foreground">
            Spark AI
          </span>
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Siswa Panel
          </span>
        </div>
      </Link>

      {/* Reactive User Level Widget */}
      <ProfileWidget data={profileData} />

      {/* Categorized Menu Sections */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h4 className="px-3 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/75">
              {section.title}
            </h4>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all",
                        active
                          ? "text-[var(--coral)] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.04)]"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      {/* Smooth Active Sliding Background */}
                      {active && (
                        <motion.span
                          layoutId="active-nav-bg"
                          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-[var(--coral)]/10 to-[var(--orange)]/5 border border-[var(--coral)]/10"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 28,
                          }}
                        />
                      )}

                      {/* Smooth Left Pill Indicator */}
                      {active && (
                        <motion.span
                          layoutId="active-nav-indicator"
                          className="absolute left-1 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-[var(--coral)] to-[var(--orange)]"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 28,
                          }}
                        />
                      )}

                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-lg transition-all duration-300 ml-1.5",
                          active
                            ? "bg-[var(--coral)] text-white shadow-[0_4px_10px_rgba(225,29,72,0.25)] scale-105"
                            : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground group-hover:scale-105",
                        )}
                      >
                        <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                      </span>
                      <span className="flex-1 tracking-wide">{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId="active-dot"
                          className="size-1.5 rounded-full bg-[var(--coral)]"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={() => signOut()}
        className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all border border-transparent text-red-500 hover:bg-red-500/10 hover:border-red-500/20 active:scale-[0.98] cursor-pointer mt-1"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
          <LogOut size={15} />
        </span>
        <span className="flex-1 text-left tracking-wide">Keluar Akun</span>
      </button>
    </nav>
  );
});
