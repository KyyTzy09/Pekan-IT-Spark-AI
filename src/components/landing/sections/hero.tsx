"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  Play,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

const STATS = [
  { num: "12K+", label: "Siswa aktif", icon: Sparkles },
  { num: "4.9", label: "Rating siswa", icon: Star },
  { num: "50+", label: "Badge & level", icon: Trophy },
];

export function Hero() {
  const [pause, setPause] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPause(mq.matches);
  }, []);

  const scrollToCourses = () => {
    document
      .getElementById("katalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden">
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
        <Reveal className="relative z-10 max-w-[640px]">
          <div
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--coral)_25%,transparent)] bg-[color-mix(in_oklch,var(--coral)_12%,transparent)] px-4 py-1.5 text-xs font-bold text-[var(--coral)] shadow-[0_4px_14px_rgba(255,107,107,0.12)] backdrop-blur-md",
              "anim-slide-up",
            )}
          >
            <Flame size={13} />
            <span>Tutor AI #1 buat siswa SMA & SMK</span>
            <span
              className={cn(
                "ml-1 h-2 w-2 rounded-full bg-[var(--coral)]",
                pause ? "" : "anim-pulse-soft",
              )}
              style={{ boxShadow: "0 0 0 4px rgba(255, 107, 107, 0.2)" }}
            />
          </div>

          <h1 className="mb-5 font-heading text-[44px] font-bold leading-[1.02] tracking-tight md:text-[58px] lg:text-[68px]">
            Belajar makin
            <br />
            <span className="text-gradient-warm">paham, seru,</span>
            <br />
            <span className="text-gradient">dan cepet.</span>
          </h1>

          <p className="mb-8 max-w-[540px] text-base leading-relaxed text-muted-foreground md:text-lg">
            Spark ngajarin kamu pelan-pelan pakai metode{" "}
            <strong className="text-foreground">Socratic</strong> — nanya dulu,
            baru kasih penjelasan yang pas di level kamu. Matematika, B.Indo,
            B.Inggris, IPA — semuanya dibahas dengan bahasa santai yang bikin
            ngerti.
          </p>

          <div className="mb-8 flex flex-wrap items-center gap-3.5">
            <Button
              asChild
              size="xl"
              className="rounded-full shadow-[0_8px_24px_rgba(255,107,107,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,107,107,0.55)]"
            >
              <Link href="/auth/register">
                <Rocket size={18} />
                Mulai Petualangan
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="secondary"
              className="rounded-full border-border/60 bg-card/80 backdrop-blur-md"
              onClick={scrollToCourses}
            >
              <Link href="#katalog">
                <Play size={16} fill="currentColor" /> Lihat Kursus
              </Link>
            </Button>
          </div>

          <div className="mb-10 flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-md">
            <div className="flex -space-x-2.5">
              {[
                "from-[var(--coral)] to-[var(--orange)]",
                "from-[var(--purple)] to-[var(--pink)]",
                "from-[var(--teal)] to-[var(--green)]",
                "from-[var(--yellow)] to-[var(--orange)]",
              ].map((g, i) => (
                <div
                  key={i}
                  className={`grid size-9 place-items-center rounded-full border-2 border-background bg-gradient-to-br ${g} text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]`}
                >
                  {["RA", "BP", "SP", "AR"][i]}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-[var(--yellow)] text-[var(--yellow)]"
                  />
                ))}
                <span className="ml-1 text-[12px] font-bold text-foreground">
                  4.9
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Dipercaya 12K+ siswa se-Indonesia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-5 border-t border-dashed border-border/60 pt-6">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="relative flex flex-col gap-0.5 pl-7"
                >
                  <Icon
                    size={18}
                    className="absolute left-0 top-0.5 text-[var(--coral)]"
                  />
                  <span className="font-heading text-[26px] font-bold leading-none text-foreground">
                    {s.num}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="relative mx-auto h-[520px] w-full max-w-md"
        >
          <Orb pause={pause} />
          <FloatingCards pause={pause} />
          <AchievementCard pause={pause} />
          <SparkleBurst pause={pause} />
        </Reveal>
      </div>

      <TrustedByMarquee />
    </section>
  );
}

function Orb({ pause }: { pause: boolean }) {
  return (
    <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2">
      <div
        className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[color-mix(in_oklch,var(--purple)_30%,transparent)]"
        style={{ animation: pause ? undefined : "spin 24s linear infinite" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dotted border-[color-mix(in_oklch,var(--teal)_25%,transparent)]"
        style={{
          animation: pause ? undefined : "spin 36s linear infinite reverse",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[color-mix(in_oklch,var(--yellow)_25%,transparent)]"
        style={{ animation: pause ? undefined : "spin 48s linear infinite" }}
      />

      <div
        className={cn(
          "absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full",
          pause ? "" : "anim-float",
        )}
        style={{
          background:
            "linear-gradient(135deg, var(--coral) 0%, var(--orange) 50%, var(--yellow) 100%)",
          boxShadow:
            "0 25px 60px -10px rgba(255,107,107,0.5), inset 0 -15px 40px rgba(0,0,0,0.18), inset 0 8px 20px rgba(255,255,255,0.3)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-3 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-2 text-white">
          <span className="font-heading text-[52px] font-bold leading-none">
            A+
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
            Spark
          </span>
        </div>
      </div>

      <div
        className="absolute left-[12%] top-[20%] h-3 w-3 rounded-full bg-[var(--coral)] shadow-[0_0_20px_rgba(255,107,107,0.6)]"
        style={{
          animation: pause ? undefined : "pulse-soft 1.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[15%] top-[35%] h-2 w-2 rounded-full bg-[var(--yellow)] shadow-[0_0_15px_rgba(255,230,109,0.7)]"
        style={{
          animation: pause ? undefined : "pulse-soft 2s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[25%] left-[18%] h-2.5 w-2.5 rounded-full bg-[var(--teal)] shadow-[0_0_18px_rgba(78,205,196,0.6)]"
        style={{
          animation: pause ? undefined : "pulse-soft 1.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function FloatingCards({ pause }: { pause: boolean }) {
  return (
    <>
      <FloatingCard
        delay={0}
        className="right-[-8px] top-[6%]"
        pause={pause}
        icon={<Trophy size={18} color="#FF6B6B" strokeWidth={2.5} />}
        title="+150 XP"
        subtitle="Misi Selesai!"
      />
      <FloatingCard
        delay={1.2}
        className="left-[-12px] top-[44%] -translate-y-1/2"
        pause={pause}
        icon={<Star size={18} color="#FFE66D" fill="#FFE66D" />}
        title="Streak 7 Hari"
        subtitle="Hebat!"
      />
    </>
  );
}

function AchievementCard({ pause }: { pause: boolean }) {
  return (
    <div
      className={cn(
        "absolute bottom-[6%] right-[-12px] flex items-center gap-3 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-[0_12px_32px_rgba(45,27,105,0.14)] backdrop-blur-md",
        pause ? "" : "anim-float",
      )}
      style={{ animationDelay: "2.4s", zIndex: 3 }}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(168,85,247,0.4)]">
        <Award size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-heading text-[14px] font-bold leading-tight text-foreground">
          Badge Baru!
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground">
          Penakluk Aljabar
        </p>
      </div>
    </div>
  );
}

function FloatingCard({
  icon,
  title,
  subtitle,
  className,
  delay,
  pause,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  delay: number;
  pause: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-[0_12px_32px_rgba(45,27,105,0.12)] backdrop-blur-md",
        pause ? "" : "anim-float",
        className,
      )}
      style={{ zIndex: 3, animationDelay: `${delay}s` }}
    >
      <div className="grid size-9 place-items-center rounded-xl bg-card shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="font-heading text-[14px] font-bold leading-tight text-foreground">
          {title}
        </span>
        <span className="text-[10.5px] font-semibold text-muted-foreground">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function SparkleBurst({ pause }: { pause: boolean }) {
  return (
    <>
      <Sparkle
        className="absolute left-[20%] top-[15%]"
        size={20}
        color="#FFE66D"
        pause={pause}
      />
      <Sparkle
        className="absolute right-[25%] top-[25%]"
        size={14}
        color="#A855F7"
        pause={pause}
        delay={1}
      />
      <Sparkle
        className="absolute bottom-[30%] left-[25%]"
        size={16}
        color="#4ECDC4"
        pause={pause}
        delay={2}
      />
    </>
  );
}

function Sparkle({
  className,
  size,
  color,
  pause,
  delay = 0,
}: {
  className?: string;
  size: number;
  color: string;
  pause: boolean;
  delay?: number;
}) {
  return (
    <svg
      className={cn(className, pause ? "" : "anim-pulse-soft")}
      style={{ animationDelay: `${delay}s` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
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
