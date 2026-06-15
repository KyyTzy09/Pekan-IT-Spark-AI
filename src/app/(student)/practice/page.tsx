import { ArrowLeft, Sparkles, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Latihan — Spark Ai",
  description: "Soal adaptif sesuai level kamu.",
};

export default async function PracticePage() {
  const session = await auth();

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
            <Target size={10} strokeWidth={2.5} />
            Latihan adaptif
          </span>
          <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
            Mode latihan{" "}
            <span className="text-gradient-cool">segera hadir</span>
          </h1>
          <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
            Soal adaptif yang naik-turun sesuai performa kamu lagi disiapin.
            Sementara itu, coba liat konstelasi mapel kamu dulu, yuk.
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
            >
              <Link href="/subjects">
                <Sparkles size={13} strokeWidth={2.5} />
                Jelajahi mapel
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/dashboard">
                <ArrowLeft size={13} />
                Balik ke beranda
              </Link>
            </Button>
          </div>
        </header>
      </Reveal>
    </div>
  );
}
