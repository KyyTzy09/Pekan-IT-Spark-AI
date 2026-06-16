"use client";

import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Rocket,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "../../shared/reveal";

const SUBJECTS = ["Matematika", "B. Indonesia", "B. Inggris", "IPA"];

export function Hero() {
  const [pause, setPause] = React.useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user;
  const role = session?.user?.role as string | undefined;
  const home =
    role === "PARENT" ? "/parent" : role === "ADMIN" ? "/admin" : "/dashboard";
  const ctaHref = isLoggedIn ? home : "/auth/register";
  const ctaLabel = isLoggedIn ? "Lanjut Belajar" : "Mulai Belajar Gratis";
  const CtaIcon = isLoggedIn ? ArrowRight : Rocket;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPause(mq.matches);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* ── Background particles ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-[5%] top-[10%] size-2.5 rounded-full bg-[var(--coral)] opacity-70"
          style={{
            animation: pause ? undefined : "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[8%] top-[18%] size-1.5 rounded-full bg-[var(--yellow)] opacity-80"
          style={{
            animation: pause ? undefined : "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[25%] left-[12%] size-2 rounded-full bg-[var(--teal)] opacity-60"
          style={{
            animation: pause ? undefined : "float 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[15%] bottom-[12%] size-2.5 rounded-full bg-[var(--purple)] opacity-60"
          style={{
            animation: pause ? undefined : "float 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/4 top-1/2 size-1.5 rounded-full bg-[var(--pink)] opacity-60"
          style={{
            animation: pause ? undefined : "float 7.5s ease-in-out infinite",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="container-px relative grid items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:py-20">
        {/* ── LEFT SIDE: New stacked feature cards design ── */}
        <Reveal className="relative z-10 max-w-[640px]">
          {/* Subject pills row */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {SUBJECTS.map((subj, i) => (
              <span
                key={subj}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 px-3 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-[var(--coral)]/30 hover:text-foreground"
                style={{
                  animation: pause
                    ? undefined
                    : `slide-up 0.5s ease-out ${i * 0.08}s backwards`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: [
                      "var(--coral)",
                      "var(--blue)",
                      "var(--teal)",
                      "var(--yellow)",
                    ][i],
                  }}
                />
                {subj}
              </span>
            ))}
          </div>

          {/* Compact heading */}
          <h1 className="mb-3 font-heading text-[40px] font-bold leading-[1.05] tracking-tight md:text-[52px] lg:text-[60px]">
            Tutor AI yang
            <br />
            bikin kamu{" "}
            <span className="text-gradient-warm">beneran paham.</span>
          </h1>

          <p className="mb-7 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground">
            Bukan sekadar jawaban — Spark nemenin proses belajar kamu dari awal
            sampai tuntas, pakai bahasa yang santai dan metode yang terbukti.
          </p>

          {/* CTA + Social proof row */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="xl"
              className="rounded-full shadow-[0_8px_24px_rgba(225,29,72,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(225,29,72,0.55)]"
            >
              <Link href={ctaHref}>
                <CtaIcon size={18} />
                {ctaLabel}
                <ArrowRight size={16} />
              </Link>
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {[
                  "from-[var(--coral)] to-[var(--orange)]",
                  "from-[var(--purple)] to-[var(--pink)]",
                  "from-[var(--teal)] to-[var(--green)]",
                ].map((g, i) => (
                  <div
                    key={i}
                    className={`grid size-8 place-items-center rounded-full border-2 border-background bg-gradient-to-br ${g} text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]`}
                  >
                    {["RA", "BP", "SP"][i]}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3 fill-[var(--yellow)] text-[var(--yellow)]"
                    />
                  ))}
                  <span className="ml-1 text-[11px] font-bold text-foreground">
                    4.9
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  12K+ siswa aktif
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── RIGHT SIDE: Bento Grid Dashboard ── */}
        <Reveal delay={120} className="relative mx-auto w-full max-w-[460px]">
          <BentoDashboard pause={pause} />
        </Reveal>
      </div>

      <TrustedByMarquee />
    </section>
  );
}

/* ─── Bento Grid Dashboard (right side visual) ─────── */

const BENTO_SUBJECTS = [
  {
    name: "Matematika",
    pct: 78,
    color: "var(--coral)",
    colorEnd: "var(--orange)",
    topics: "12/15",
  },
  {
    name: "B. Indonesia",
    pct: 92,
    color: "var(--blue)",
    colorEnd: "var(--teal)",
    topics: "23/25",
  },
  {
    name: "B. Inggris",
    pct: 64,
    color: "var(--teal)",
    colorEnd: "var(--green)",
    topics: "16/25",
  },
  {
    name: "IPA",
    pct: 41,
    color: "var(--yellow)",
    colorEnd: "var(--orange)",
    topics: "8/20",
  },
];

function BentoDashboard({ pause }: { pause: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ perspective: "1200px" }}>
      {/* ── Progress Card (spans 2 cols) ── */}
      <div
        className="group/progress col-span-2 relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(80,20,50,0.18)]"
        style={{
          animation: pause
            ? undefined
            : "slide-up 0.6s ease-out 0.1s backwards",
        }}
      >
        {/* Shimmer overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-opacity duration-500 group-hover/progress:opacity-100"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            animation: pause ? undefined : "shimmer 3s ease-in-out infinite",
          }}
        />
        {/* Corner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover/progress:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
          }}
        />

        <div className="relative mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
              <TrendingUp size={15} strokeWidth={2.5} />
              {/* Icon glow ring */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl"
                style={{
                  boxShadow: "0 0 0 3px rgba(139,92,246,0.12)",
                  animation: pause
                    ? undefined
                    : "pulse-soft 3s ease-in-out infinite",
                }}
              />
            </div>
            <span className="font-heading text-[14px] font-bold text-foreground">
              Progress Belajar
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--teal)_12%,transparent)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--teal)]">
            <span
              className="size-1.5 rounded-full bg-[var(--teal)]"
              style={{
                animation: pause
                  ? undefined
                  : "pulse-soft 1.5s ease-in-out infinite",
              }}
            />
            Live
          </span>
        </div>
        <div className="relative space-y-3">
          {BENTO_SUBJECTS.map((s, i) => (
            <div key={s.name} className="group/bar">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-[11.5px] font-bold text-foreground">
                    {s.name}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {s.topics} · <span className="text-foreground">{s.pct}%</span>
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-muted/80">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.colorEnd})`,
                    animation: pause
                      ? undefined
                      : `slide-up 0.8s ease-out ${0.3 + i * 0.15}s backwards`,
                  }}
                />
                {/* Progress bar shine */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${s.pct}%`,
                    background:
                      "linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.3) 80%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: pause
                      ? undefined
                      : `shimmer 2.5s ease-in-out ${1 + i * 0.4}s infinite`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Streak Card ── */}
      <div
        className="group/streak relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] p-5 text-white shadow-[0_8px_24px_rgba(225,29,72,0.25)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(225,29,72,0.4)]"
        style={{
          animation: pause
            ? undefined
            : "slide-up 0.6s ease-out 0.25s backwards",
        }}
      >
        {/* Radial glow behind number */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/3 rounded-full opacity-30 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)",
          }}
        />
        {/* Floating fire particles */}
        {!pause && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 size-1.5 rounded-full bg-white/60"
              style={{ animation: "float 3s ease-in-out infinite" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-8 bottom-6 size-1 rounded-full bg-yellow-200/50"
              style={{ animation: "float 4s ease-in-out 0.5s infinite" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-4 bottom-4 size-1 rounded-full bg-white/40"
              style={{ animation: "float 3.5s ease-in-out 1s infinite" }}
            />
          </>
        )}

        <div className="relative mb-3 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <Flame
              size={20}
              strokeWidth={2.5}
              className={cn(
                "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]",
                !pause && "anim-pulse-soft",
              )}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            Streak
          </span>
        </div>
        <p className="relative font-heading text-[42px] font-bold leading-none tracking-tight">
          7
          <span className="ml-1 text-[14px] font-semibold opacity-70">
            hari
          </span>
        </p>
        <p className="mt-1 text-[11px] font-semibold opacity-75">
          berturut-turut 🔥
        </p>
        {/* Day indicator dots */}
        <div className="mt-3 flex gap-1.5">
          {["S", "S", "R", "K", "J", "S", "M"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="size-3 rounded-full border border-white/30 bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                style={{
                  animation: pause
                    ? undefined
                    : `pulse-soft 2.5s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
              <span className="text-[7px] font-bold uppercase opacity-60">
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── XP / Level Card ── */}
      <div
        className="group/xp relative overflow-hidden rounded-2xl border border-border/40 bg-card/90 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(80,20,50,0.18)]"
        style={{
          animation: pause
            ? undefined
            : "slide-up 0.6s ease-out 0.35s backwards",
        }}
      >
        {/* Corner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover/xp:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)",
          }}
        />

        <div className="relative mb-3 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--yellow)]/20 to-[var(--orange)]/20 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]">
            <Zap
              size={18}
              className="text-[var(--yellow)] drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
              strokeWidth={2.5}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Level
          </span>
        </div>
        <p className="relative font-heading text-[17px] font-bold leading-tight text-foreground">
          Pejuang ⚡
        </p>
        <p className="mb-3 text-[10px] font-semibold text-muted-foreground">
          <span className="tabular-nums text-foreground">1.240</span> / 2.000 XP
        </p>
        {/* Enhanced progress bar */}
        <div className="relative h-3 overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--yellow)] to-[var(--orange)] transition-all duration-1000"
            style={{ width: "62%" }}
          />
          {/* Shine effect */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[62%] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
              backgroundSize: "300% 100%",
              animation: pause
                ? undefined
                : "shimmer 3s ease-in-out 0.5s infinite",
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[9px] font-bold text-muted-foreground">
            <span className="text-[var(--coral)]">760 XP</span> lagi ke Ahli
          </p>
          <span className="text-[9px] font-bold tabular-nums text-foreground/50">
            62%
          </span>
        </div>
      </div>
    </div>
  );
}

function TrustedByMarquee() {
  const items = [
    "Kurikulum Merdeka",
    "CP & ATP Resmi",
    "BSE Kemendikbud",
    "Selaras dengan sekolah",
    "Gratis untuk siswa",
    "24/7 tutor AI",
  ];

  return (
    <div className="border-y border-dashed border-border/40 bg-card/30 py-4 backdrop-blur-sm">
      <div className="container-px flex items-center gap-6 overflow-hidden">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Selaras dengan
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{ animation: "scroll-x 30s linear infinite" }}
          >
            {[...items, ...items].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-2 text-[12px] font-bold text-foreground/60"
              >
                <CheckCircle2 size={12} className="text-[var(--teal)]" />
                {item}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </div>
  );
}
