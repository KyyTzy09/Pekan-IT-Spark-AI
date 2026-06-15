"use client";

import {
  BookOpen,
  Calendar,
  Flame,
  Home,
  type LucideIcon,
  MessageCircle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparkCharacter } from "@/components/student/spark-character";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Beranda",
    shortLabel: "Beranda",
    icon: Home,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/subjects",
    label: "Mapel",
    shortLabel: "Mapel",
    icon: BookOpen,
    match: (p) => p.startsWith("/subjects") || p.startsWith("/topics"),
  },
  {
    href: "/chat",
    label: "Tanya Spark",
    shortLabel: "Tanya",
    icon: MessageCircle,
    match: (p) => p.startsWith("/chat"),
  },
  {
    href: "/practice",
    label: "Latihan",
    shortLabel: "Latihan",
    icon: Calendar,
    match: (p) => p.startsWith("/practice"),
  },
  {
    href: "/upload",
    label: "Upload",
    shortLabel: "Upload",
    icon: Upload,
    match: (p) => p.startsWith("/upload") || p.startsWith("/documents"),
  },
];

export function StudentNav({
  variant = "sidebar",
  className,
}: {
  variant?: "sidebar" | "bottom";
  className?: string;
}) {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(pathname));
  const activeIdx = activeIndex === -1 ? 0 : activeIndex;

  if (variant === "bottom") {
    return (
      <nav
        aria-label="Navigasi utama"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden",
          className,
        )}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1 py-1.5">
          {NAV_ITEMS.map((item, i) => {
            const active = i === activeIdx;
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10.5px] font-semibold transition-colors",
                    active
                      ? "text-[var(--coral)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-2xl transition-all",
                      active
                        ? "bg-[var(--coral)]/12 text-[var(--coral)]"
                        : "bg-transparent",
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
                  <span className="leading-none">{item.shortLabel}</span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--coral)]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn("flex flex-col gap-1", className)}
    >
      <Link
        href="/dashboard"
        className="mb-4 flex items-center gap-2.5 rounded-2xl px-2 py-1.5"
      >
        <span className="relative grid size-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 to-transparent"
          />
          <Flame size={18} strokeWidth={2.5} className="relative" />
        </span>
        <div className="flex flex-col">
          <span className="font-heading text-[15px] font-bold leading-none text-foreground">
            Spark Ai
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            Student
          </span>
        </div>
      </Link>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item, i) => {
          const active = i === activeIdx;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-semibold transition-all",
                  active
                    ? "bg-[var(--coral)]/8 text-[var(--coral)] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.12)]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-xl transition-colors",
                    active
                      ? "bg-[var(--coral)] text-white shadow-[0_4px_10px_rgba(225,29,72,0.35)]"
                      : "bg-muted/60 text-muted-foreground group-hover:bg-muted",
                  )}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="flex-1">{item.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-[var(--coral)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <SparkCharacter size="sm" />
          <p className="text-[11px] font-semibold text-foreground">
            Spark standby 24/7
          </p>
        </div>
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          Tinggal tap ikon chat di kiri buat mulai ngobrol. Sabar, nggak
          ngehakimin.
        </p>
      </div>
    </nav>
  );
}
