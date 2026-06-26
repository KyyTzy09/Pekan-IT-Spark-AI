"use client";

import { motion, useInView } from "framer-motion";
import { Compass, MessageCircle, Target, TrendingUp } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "../../shared/reveal";

const steps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Pilih mapel & tanya Spark",
    desc: "Mulai dari materi yang lagi kamu pelajarin. Spark nanya balik dengan metode Socratic biar kamu mikir sendiri.",
    color: "from-[var(--coral)] to-[var(--orange)]",
    glowColor: "rgba(225,29,72,0.3)",
  },
  {
    step: "02",
    icon: Target,
    title: "Latihan soal adaptif",
    desc: "Soal otomatis menyesuaikan kemampuan kamu. Naik tingkat kalau lancar, turun kalau masih struggle.",
    color: "from-[var(--yellow)] to-[var(--orange)]",
    glowColor: "rgba(245,158,11,0.3)",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Liat progress & raih badge",
    desc: "Bintang konsep nyala, XP nambah, level naik. Streak harian bikin belajar konsisten tanpa tekanan.",
    color: "from-[var(--teal)] to-[var(--green)]",
    glowColor: "rgba(20,184,166,0.3)",
  },
];

export function HowItWorks() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="cara-kerja" className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
          <Compass size={13} /> Cara Kerja
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Tiga langkah simpel,{" "}
          <span className="text-gradient">banyak yang kepaham.</span>
        </h2>
        <p className="mx-auto max-w-[600px] text-sm text-muted-foreground md:text-base">
          Dari nanya sampai liat progress, semua dirancang biar kamu fokus ke
          yang penting: belajar dengan beneran.
        </p>
      </Reveal>

      {/* Timeline layout */}
      <div ref={sectionRef} className="relative mx-auto mt-12 max-w-5xl">
        {/* Vertical timeline line (desktop only) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 hidden w-[2px] -translate-x-1/2 md:block"
          style={{ height: "100%" }}
        >
          <div
            className="w-full rounded-full bg-gradient-to-b from-[var(--coral)] via-[var(--yellow)] to-[var(--teal)]"
            style={{
              height: isInView ? "100%" : "0%",
              transition: "height 1.5s ease-out",
            }}
          />
        </div>

        {/* Pulsing dots at top and bottom */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block"
        >
          <span
            className="block size-3 rounded-full bg-[var(--coral)] shadow-[0_0_12px_rgba(225,29,72,0.5)]"
            style={{ animation: "pulse-soft 2s ease-in-out infinite" }}
          />
        </div>
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 md:block"
        >
          <span
            className="block size-3 rounded-full bg-[var(--teal)] shadow-[0_0_12px_rgba(20,184,166,0.5)]"
            style={{ animation: "pulse-soft 2s ease-in-out 1s infinite" }}
          />
        </div>

        {/* Mobile timeline line */}
        <div
          aria-hidden
          className="absolute left-6 top-0 w-[2px] md:hidden"
          style={{ height: "100%" }}
        >
          <div
            className="w-full rounded-full bg-gradient-to-b from-[var(--coral)] via-[var(--yellow)] to-[var(--teal)]"
            style={{
              height: isInView ? "100%" : "0%",
              transition: "height 1.5s ease-out",
            }}
          />
        </div>

        <div className="flex flex-col gap-12 md:gap-16">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isLeft = i % 2 === 0;

            return (
              <div key={s.step} className="relative">
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
                  {/* Left content or spacer */}
                  {isLeft ? (
                    <motion.div
                      initial={{ opacity: 0, x: -40 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        delay: 0.3 + i * 0.3,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    >
                      <StepCard s={s} Icon={Icon} align="right" />
                    </motion.div>
                  ) : (
                    <div />
                  )}

                  {/* Center step number */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{
                      delay: 0.2 + i * 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="relative z-10"
                  >
                    <div
                      className={`grid size-14 place-items-center rounded-full bg-gradient-to-br ${s.color} font-heading text-lg font-bold text-white shadow-lg`}
                      style={{
                        boxShadow: `0 4px 20px ${s.glowColor}`,
                      }}
                    >
                      {s.step}
                    </div>
                  </motion.div>

                  {/* Right content or spacer */}
                  {!isLeft ? (
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        delay: 0.3 + i * 0.3,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    >
                      <StepCard s={s} Icon={Icon} align="left" />
                    </motion.div>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Mobile layout */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    delay: 0.2 + i * 0.25,
                    duration: 0.5,
                  }}
                  className="flex items-start gap-5 md:hidden"
                >
                  {/* Step number on timeline */}
                  <div
                    className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${s.color} font-heading text-sm font-bold text-white shadow-lg`}
                    style={{ boxShadow: `0 4px 16px ${s.glowColor}` }}
                  >
                    {s.step}
                  </div>
                  <StepCard s={s} Icon={Icon} align="left" />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  s,
  Icon,
  align,
}: {
  s: (typeof steps)[number];
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "clay group relative overflow-hidden p-6",
        align === "right" && "md:text-right",
      )}
    >
      {/* Hover glow */}
      <div
        aria-hidden
        className="absolute -right-12 -top-12 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, ${s.glowColor}, transparent 70%)`,
        }}
      />
      {/* Shine sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
        }}
      />

      <div
        className={cn(
          "mb-4 flex items-center justify-between",
          align === "right" && "md:flex-row-reverse",
        )}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]`}
        >
          <Icon size={22} strokeWidth={2.3} />
        </div>
        <span className="font-heading text-3xl font-bold text-foreground/10 md:hidden">
          {s.step}
        </span>
      </div>
      <h3 className="mb-2 font-heading text-lg font-bold text-foreground">
        {s.title}
      </h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {s.desc}
      </p>
    </div>
  );
}
