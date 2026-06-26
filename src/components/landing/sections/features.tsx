"use client";

import { motion } from "framer-motion";
import {
  Brain,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Upload,
} from "lucide-react";
import * as React from "react";
import { Reveal } from "../../shared/reveal";

const features = [
  {
    icon: Brain,
    title: "Penjelasan yang pas di level kamu",
    desc: "Spark nyimpen profil kemampuan kamu. Materi yang susah dikasih contoh kontekstual, yang udah dikuasi langsung loncat. Gak ada yang kelewat, gak ada yang kelamaan.",
    color: "from-[var(--purple)] to-[var(--pink)]",
    glowColor: "rgba(139,92,246,0.15)",
    span: "lg:col-span-2",
  },
  {
    icon: MessageCircle,
    title: "Tanya jawab ala Socratic",
    desc: "Bukan dikasih jawaban langsung. Spark nanya balik biar kamu mikir sendiri dan beneran paham konsepnya.",
    color: "from-[var(--coral)] to-[var(--orange)]",
    glowColor: "rgba(225,29,72,0.15)",
    span: "lg:col-span-1 lg:row-span-2",
  },
  {
    icon: Target,
    title: "Latihan adaptif",
    desc: "Soal otomatis naik kalau kamu lancar, turun kalau masih struggle.",
    color: "from-[var(--yellow)] to-[var(--orange)]",
    glowColor: "rgba(245,158,11,0.15)",
    span: "lg:col-span-1",
  },
  {
    icon: Upload,
    title: "Upload materi guru",
    desc: "Punya PDF atau DOCX dari WhatsApp guru? Spark ubah jadi ringkasan, kuis, atau sesi latihan otomatis.",
    color: "from-[var(--teal)] to-[var(--green)]",
    glowColor: "rgba(20,184,166,0.15)",
    span: "lg:col-span-1",
  },
  {
    icon: Trophy,
    title: "Gamifikasi yang sehat",
    desc: "XP, level, streak, dan badge — tanpa FOMO, tanpa energi/hidup. Streak yang putus bukan hukuman, tapi kesempatan untuk mulai lagi.",
    color: "from-[var(--pink)] to-[var(--purple)]",
    glowColor: "rgba(244,114,182,0.15)",
    span: "lg:col-span-1",
  },
  {
    icon: Sparkles,
    title: "Bintang konsep & skill tree",
    desc: "Visualisasi konstelasi yang nunjukin konsep mana yang udah dikuasi dan apa yang harus dipelajari selanjutnya.",
    color: "from-[var(--blue)] to-[var(--teal)]",
    glowColor: "rgba(14,165,233,0.15)",
    span: "lg:col-span-2",
  },
];

const SPARKLE_POSITIONS = [
  { top: "15%", left: "25%", delay: 0, size: 14 },
  { top: "40%", left: "75%", delay: 1.2, size: 12 },
  { top: "65%", left: "15%", delay: 0.6, size: 16 },
  { top: "80%", left: "85%", delay: 1.8, size: 10 },
  { top: "30%", left: "50%", delay: 2.4, size: 13 },
];

export function Features() {
  const sectionRef = React.useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="fitur"
      className="container-px relative py-16 md:py-24"
    >
      {/* Floating decorative orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 size-[400px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)",
          animation: "morph-blob 12s ease-in-out infinite",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-1/4 size-[350px] rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(225,29,72,0.3), transparent 70%)",
          animation: "morph-blob 15s ease-in-out 3s infinite",
          borderRadius: "40% 60% 70% 30% / 40% 70% 30% 60%",
        }}
      />

      {/* Sparkle decorations */}
      {SPARKLE_POSITIONS.map((sp) => (
        <div
          key={`${sp.top}-${sp.left}`}
          aria-hidden
          className="pointer-events-none absolute text-[var(--yellow)] opacity-20"
          style={{
            top: sp.top,
            left: sp.left,
            animation: `sparkle 3s ease-in-out ${sp.delay}s infinite`,
          }}
        >
          <Sparkles size={sp.size} />
        </div>
      ))}

      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--purple)]">
          <Sparkles size={13} /> Fitur Unggulan
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Enam kemampuan yang{" "}
          <span className="text-gradient">beneran bantu</span> kamu paham.
        </h2>
        <p className="mx-auto max-w-[600px] text-sm leading-relaxed text-muted-foreground md:text-base">
          Bukan cuma kasih jawaban. Spark bener-bener ngertiin kamu dan nemenin
          proses belajarnya dari awal sampai kamu paham.
        </p>
        {/* Animated gradient divider */}
        <div
          className="mx-auto mt-5 h-1 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--coral), var(--purple), var(--teal), var(--coral))",
            backgroundSize: "200% auto",
            animation: "gradient-shift 3s ease infinite",
          }}
        />
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={i * 50} className={f.span}>
              <motion.div
                whileHover={{
                  y: -8,
                  rotateX: 2,
                  rotateY: -2,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
                style={{ perspective: "1000px" }}
                className="clay group relative h-full overflow-hidden p-6"
              >
                {/* Hover glow */}
                <div
                  aria-hidden
                  className="absolute -right-12 -top-12 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, ${f.glowColor}, transparent 70%)`,
                  }}
                />
                {/* Shine sweep on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
                  }}
                />

                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-[0_6px_18px_rgba(0,0,0,0.1)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]`}
                >
                  <Icon size={22} strokeWidth={2.3} />
                </motion.div>
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
