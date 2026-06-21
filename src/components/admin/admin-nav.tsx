"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  ScrollText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/use-session";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Operasional",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        shortLabel: "Home",
        icon: LayoutDashboard,
        match: (p) => p === "/admin",
      },
      {
        href: "/admin/custom-subjects",
        label: "Verifikasi Mapel",
        shortLabel: "Mapel",
        icon: BookOpen,
        match: (p) => p.startsWith("/admin/custom-subjects"),
      },
      {
        href: "/admin/subjects",
        label: "Kelola Mapel",
        shortLabel: "Kelola",
        icon: BookOpen,
        match: (p) => p.startsWith("/admin/subjects"),
      },
    ],
  },
  {
    title: "Konten (segera)",
    items: [
      {
        href: "/admin/questions",
        label: "Bank Soal",
        shortLabel: "Soal",
        icon: ClipboardList,
        match: (p) => p.startsWith("/admin/questions"),
      },
      {
        href: "/admin/badges",
        label: "Badge",
        shortLabel: "Badge",
        icon: Shield,
        match: (p) => p.startsWith("/admin/badges"),
      },
    ],
  },
  {
    title: "Moderasi (segera)",
    items: [
      {
        href: "/admin/moderation",
        label: "Chat & Laporan",
        shortLabel: "Moderasi",
        icon: Flag,
        match: (p) => p.startsWith("/admin/moderation"),
      },
      {
        href: "/admin/audit",
        label: "Audit Log",
        shortLabel: "Audit",
        icon: ScrollText,
        match: (p) => p.startsWith("/admin/audit"),
      },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const flatItems = SECTIONS.flatMap((s) => s.items);
  const activeIndex = flatItems.findIndex((item) => item.match(pathname));
  const activeItem = flatItems[activeIndex];

  return (
    <nav
      aria-label="Navigasi admin"
      className="sticky top-0 z-30 border-b border-border/40 bg-card/85 backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-2xl px-2 py-1 transition-transform hover:scale-[1.02]"
        >
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-[0_6px_18px_rgba(15,23,42,0.35)]">
            <Shield size={18} strokeWidth={2.5} className="relative" />
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-[15px] font-extrabold leading-none tracking-tight text-foreground">
              Spark Admin
            </span>
            <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
              Content Management
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {flatItems.map((item, i) => {
            const active = i === activeIndex;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-active-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-slate-200 to-slate-100 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] dark:from-slate-800 dark:to-slate-700"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {activeItem && (
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white sm:inline-block">
              {activeItem.shortLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="grid size-9 place-items-center rounded-xl border border-border/40 bg-card/60 text-muted-foreground transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
            aria-label="Keluar"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav (sticky) */}
      <div className="md:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-2 pb-2">
          {flatItems.slice(0, 4).map((item, i) => {
            const active = i === activeIndex;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-border/40 bg-card/60 text-muted-foreground",
                )}
              >
                <Icon size={12} />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Static export for the audit pill at top
export const ADMIN_NAV_SECTIONS = SECTIONS;
