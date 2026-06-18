"use client";

import {
  BookOpen,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ParentNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parent/history", label: "Riwayat", icon: Clock },
    { href: "/parent/guide", label: "Panduan", icon: BookOpen },
    { href: "/parent/link", label: "Hubungkan Anak", icon: UserPlus },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <Link href="/parent" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
              <Sparkles size={16} strokeWidth={2.5} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-heading text-[16px] font-extrabold tracking-tight text-foreground">
                Spark Ai
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
                Parent Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-all duration-200",
                    active
                      ? "text-[var(--blue)] bg-[var(--blue)]/8"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="rounded-xl gap-2 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={14} />
            Keluar
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-card/95 px-4 py-4 md:hidden space-y-3 shadow-inner">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition-all",
                    active
                      ? "text-[var(--blue)] bg-[var(--blue)]/8"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full justify-start rounded-xl gap-2 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={14} />
              Keluar
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
