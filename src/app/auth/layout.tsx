import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthBranding } from "@/components/auth/auth-branding";

export const metadata: Metadata = {
  title: "Masuk atau Daftar — Spark Ai",
  description:
    "Akses akun Spark Ai kamu atau buat akun baru gratis. Mulai belajar dengan tutor AI yang sabar dan adaptif.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#fdfbf7] via-[#f5efe6] to-[#edf3f6] dark:from-[#130b24] dark:via-[#0f071a] dark:to-[#07030c]">
      {/* ─── Left Branding Panel (client, route-aware) ─── */}
      <AuthBranding />

      {/* ─── Right Form Panel ─── */}
      <div className="relative flex w-full lg:w-1/2 flex-col">
        {/* Subtle background accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.20] dark:opacity-[0.10]"
        >
          <div className="absolute -right-40 -top-40 size-[500px] rounded-full bg-gradient-to-br from-rose-500/20 via-transparent to-purple-500/15 blur-3xl" />
          <div className="absolute -left-40 -bottom-40 size-[400px] rounded-full bg-gradient-to-br from-teal-500/15 via-transparent to-blue-500/10 blur-3xl" />
        </div>

        {/* Mobile logo (lg:hidden) */}
        <header className="flex items-center px-6 pt-6 lg:hidden">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 focus:outline-none"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-md transition-all duration-300 group-hover:scale-105">
              <GraduationCap size={18} strokeWidth={2.5} />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-gradient">
              Spark Ai
            </span>
          </Link>
        </header>

        {/* Form content */}
        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 md:px-16 lg:px-16 xl:px-24">
          <div className="w-full max-w-[420px] anim-slide-up gpu">
            {children}
          </div>
        </main>

        <footer className="px-6 pb-6 lg:px-16">
          <p className="text-[11px] text-muted-foreground/50">
            © 2026 Spark Ai · Belajar tanpa batas
          </p>
        </footer>
      </div>
    </div>
  );
}
