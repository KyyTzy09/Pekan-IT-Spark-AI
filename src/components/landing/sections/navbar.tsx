"use client";

import {
  BookMarked,
  Compass,
  Gamepad2,
  GraduationCap,
  LogIn,
  Menu,
  MessageCircle,
  Rocket,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/use-session";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#fitur", label: "Fitur", id: "fitur", icon: Sparkles },
  { href: "#katalog", label: "Kursus", id: "katalog", icon: BookMarked },
  { href: "#cara-kerja", label: "Cara Kerja", id: "cara-kerja", icon: Compass },
  { href: "#progress", label: "Progress", id: "progress", icon: GraduationCap },
  { href: "#cerita", label: "Cerita Siswa", id: "cerita", icon: MessageCircle },
] as const;

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard",
  PARENT: "/parent",
  ADMIN: "/admin",
};

const SECTION_IDS = NAV_LINKS.map((l) => l.id);

function useActiveSection() {
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

export function Navbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const active = useActiveSection();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLoggedIn = status === "authenticated" && session?.user;
  const role = session?.user?.role as string | undefined;
  const home = role ? (ROLE_HOME[role] ?? "/dashboard") : "/dashboard";
  const initial = (session?.user?.name ?? session?.user?.email ?? "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full pt-4 md:pt-5">
      <div className="container-px relative">
        <div
          className={cn(
            "flex h-16 items-center justify-between gap-2 rounded-full border px-2.5 transition-all duration-300 md:h-[68px]",
            scrolled
              ? "border-border/50 bg-background/80 shadow-[0_8px_32px_-12px_rgba(80,20,50,0.12)] backdrop-blur-xl backdrop-saturate-150"
              : "border-transparent bg-transparent shadow-none backdrop-blur-0",
          )}
        >
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-full pl-2.5 pr-3.5 py-2 transition-colors"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)] transition-shadow group-hover:shadow-[0_6px_20px_rgba(225,29,72,0.55)]">
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
              <GraduationCap size={18} strokeWidth={2.5} className="relative" />
            </span>
            <span className="font-heading text-[17px] font-semibold text-gradient">
              Spark Ai
            </span>
          </Link>

          <nav
            className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center md:flex"
            aria-label="Main"
          >
            <ul
              className={cn(
                "pointer-events-auto flex items-center gap-0.5 rounded-full p-1 transition-colors",
                scrolled
                  ? "bg-muted/50"
                  : "bg-card/40 backdrop-blur-md border border-white/40",
              )}
            >
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = active === link.id;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        size={13}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "transition-colors",
                          isActive && "text-[var(--coral)]",
                        )}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 pr-1.5">
            {isLoggedIn ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden h-10 rounded-full px-3 text-[13px] font-semibold md:inline-flex"
                >
                  <Link href={home}>
                    <User size={14} />
                    Lanjut
                  </Link>
                </Button>
                <Link
                  href={home}
                  aria-label="Buka dashboard"
                  className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.35)] transition-transform hover:-translate-y-0.5"
                >
                  {initial}
                </Link>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden h-10 rounded-full px-4 text-[13px] font-semibold md:inline-flex"
                >
                  <Link href="/auth/login">
                    <LogIn size={14} />
                    Masuk
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden h-10 rounded-full px-4 text-[13px] font-semibold md:inline-flex shadow-[0_4px_14px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_18px_rgba(225,29,72,0.45)]"
                >
                  <Link href="/auth/register">
                    <Rocket size={14} strokeWidth={2.5} />
                    Mulai
                  </Link>
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="absolute inset-x-2 top-full z-50 mt-2 flex flex-col gap-0.5 rounded-2xl border border-border/50 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150 md:hidden">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = active === link.id;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
            {isLoggedIn ? (
              <Link
                href={home}
                onClick={() => setOpen(false)}
                className="mt-1.5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--coral)] text-sm font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.35)]"
              >
                <User size={14} /> Lanjut ke{" "}
                {home.replace("/", "") || "beranda"}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="mt-1.5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--coral)] text-sm font-bold text-white shadow-[0_4px_14px_rgba(225,29,72,0.35)]"
                >
                  <Gamepad2 size={14} /> Daftar Gratis
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
