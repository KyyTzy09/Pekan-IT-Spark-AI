"use client";

import {
  ArrowRight,
  BookOpen,
  Brain,
  Flame,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

interface PracticeLandingProps {
  subjectSlug?: string;
}

const MODES = [
  {
    id: "topic",
    icon: BookOpen,
    emoji: "📚",
    title: "Latihan Topik Spesifik",
    description: "Pilih mapel → pilih topik → mulai latihan topik itu",
    useCase: "Cocok buat: fokus belajar 1 topik tertentu",
    color: "var(--teal)",
    gradient: "from-[var(--teal)] to-[var(--blue)]",
    href: "/practice/topics",
  },
  {
    id: "adaptive",
    icon: Brain,
    emoji: "🎯",
    title: "Adaptive (Sistem Pilihkan)",
    description: "Soal dipilih otomatis berdasarkan kelemahanmu",
    useCase: "Cocok buat: latihan menyeluruh",
    color: "var(--purple)",
    gradient: "from-[var(--purple)] to-[var(--pink)]",
    href: "/practice?mode=adaptive",
  },
  {
    id: "generate",
    icon: Sparkles,
    emoji: "✨",
    title: "Generate Soal Custom",
    description: "Pilih konsep atau ketik tema bebas, AI buatkan",
    useCase: "Cocok buat: latihan spesifik / persiapan ujian",
    color: "var(--coral)",
    gradient: "from-[var(--coral)] to-[var(--orange)]",
    href: "/practice/generate",
  },
];

export function PracticeLanding({ subjectSlug }: PracticeLandingProps) {
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                <Target size={10} strokeWidth={2.5} />
                Spark Practice
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
                Mode{" "}
                <span className="text-gradient-cool">Latihan</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                Pilih cara latihanmu. Soal adaptif, topik spesifik, atau generate custom sesuai kebutuhan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border/40 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Limit hari ini:
                </span>
                <span className="ml-1 text-[11px] font-bold text-[var(--purple)]">
                  2x generate
                </span>
              </div>
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={40}>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODES.map((mode, idx) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.id}
                href={mode.href}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-5 backdrop-blur-xl transition-all",
                  "hover:border-transparent hover:shadow-[0_12px_32px_rgba(80,20,50,0.12)]",
                  "hover:-translate-y-0.5",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-40",
                  )}
                  style={{
                    background: `radial-gradient(circle, ${mode.color}, transparent 70%)`,
                  }}
                />
                <div className="relative">
                  <div
                    className={cn(
                      "grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                      mode.gradient,
                    )}
                  >
                    <Icon size={22} />
                  </div>
                  <h2 className="mt-4 font-heading text-[16px] font-bold leading-tight">
                    {mode.emoji} {mode.title}
                  </h2>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {mode.description}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground/70">
                    {mode.useCase}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                    Mulai
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
