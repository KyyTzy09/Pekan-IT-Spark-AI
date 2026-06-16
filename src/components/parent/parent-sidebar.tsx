"use client";

import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Smile,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/link", label: "Hubungkan Anak", icon: UserPlus },
];

export function ParentSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const user = session?.user;

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-card/60 border-r border-border/40 backdrop-blur-xl p-6">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8">
        <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_8px_20px_rgba(14,165,233,0.25)]">
          <Sparkles size={18} strokeWidth={2.5} />
        </span>
        <div className="flex flex-col leading-none">
          <span className="font-heading text-[18px] font-extrabold tracking-tight text-foreground">
            Spark Ai
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blue)] mt-0.5">
            Parent Portal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        <p className="text-[9.5px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3 px-3">
          Menu Utama
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4.5 py-3 text-[13.5px] font-bold transition-all duration-300 group",
                active
                  ? "text-[var(--blue)] bg-[var(--blue)]/8 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon
                size={16}
                strokeWidth={2.3}
                className={cn(
                  "transition-transform group-hover:scale-110",
                  active
                    ? "text-[var(--blue)]"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-[var(--blue)] shadow-[0_0_8px_var(--blue)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Supportive Kid-friendly Quote Box */}
      <div className="mb-6 rounded-2xl border border-[color-mix(in_oklch,var(--teal)_20%,transparent)] bg-[color-mix(in_oklch,var(--teal)_6%,transparent)] p-4">
        <div className="flex items-center gap-2 text-[var(--teal)] mb-1">
          <Heart size={14} fill="currentColor" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Tips Suportif
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Jangan lupa berikan apresiasi kecil atas usaha belajar anak hari ini!
          🌟
        </p>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground font-bold text-[14px]">
              {user.name ? user.name[0].toUpperCase() : <Smile size={16} />}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-bold text-foreground">
                {user.name || "Orang Tua"}
              </p>
              <p className="truncate text-[10.5px] text-muted-foreground">
                {user.email || "parent@sparkai.com"}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full justify-start rounded-2xl gap-3 font-bold text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 py-5"
        >
          <LogOut size={16} strokeWidth={2.3} />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:flex lg:w-72">
        <SidebarContent />
      </aside>

      {/* Mobile Top Navigation Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/40 bg-card/75 px-4 backdrop-blur-md md:hidden">
        <Link href="/parent" className="flex items-center gap-2">
          <span className="grid size-8.5 place-items-center rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_4px_10px_rgba(14,165,233,0.2)]">
            <Sparkles size={14} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-[15.5px] font-extrabold tracking-tight text-foreground">
            Spark Ai
          </span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 border-none bg-transparent"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Parent Navigation Menu</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
