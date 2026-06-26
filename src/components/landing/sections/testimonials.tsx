"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "../../shared/reveal";

const keunggulan = [
  {
    icon: CheckCircle2,
    title: "Belajar Adaptif",
    desc: "Materi dan soal menyesuaikan level pemahaman kamu — bukan sekadar soal acak. Makin sering kamu jawab, makin tepat rekomendasi belajarnya.",
    color: "from-[var(--teal)] to-[var(--green)]",
    glowColor: "rgba(20,184,166,0.2)",
  },
  {
    icon: MessageCircle,
    title: "Tutor AI 24/7",
    desc: "Nanya kapan aja, dijawab dengan metode Socratic — bukan dikasih jawaban instan, tapi dituntun nemuin jawabannya sendiri.",
    color: "from-[var(--coral)] to-[var(--orange)]",
    glowColor: "rgba(225,29,72,0.2)",
  },
  {
    icon: Star,
    title: "Gratis Selamanya",
    desc: "Semua fitur bisa dipakai gratis — pretest, latihan soal, progress tracking, sampe upload dokumen. Tanpa batas waktu, tanpa iklan.",
    color: "from-[var(--purple)] to-[var(--pink)]",
    glowColor: "rgba(139,92,246,0.2)",
  },
];

const fiturTambahan = [
  {
    title: "Upload Materi Sekolah",
    desc: "Upload PDF rangkuman dari guru, Spark bikin kuis dan rangkuman otomatis.",
  },
  {
    title: "Gamifikasi & Streak",
    desc: "XP, badge, leaderboard — bikin belajar jadi kebiasaan harian yang nagih.",
  },
  {
    title: "Progress Real-time",
    desc: "Lihat perkembangan kamu per topik per mapel — tau persis bagian mana yang harus diperkuat.",
  },
  {
    title: "Orang Tua Bisa Pantau",
    desc: "Orang tua dapat laporan aktivitas belajar lewat dashboard khusus.",
  },
];

const FLOATING_CHECKS = [
  { top: "12%", left: "3%", delay: 0, dur: "7s" },
  { top: "35%", left: "95%", delay: 1.5, dur: "8s" },
  { top: "70%", left: "5%", delay: 0.8, dur: "6.5s" },
  { top: "85%", left: "92%", delay: 2, dur: "7.5s" },
];

export function Testimonials() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section
      ref={sectionRef}
      id="keunggulan"
      className="container-px relative py-16 md:py-24"
    >
      {/* Parallax background orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/4 size-[350px] rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.3), transparent 70%)",
          y: orbY1,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-1/4 size-[300px] rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)",
          y: orbY2,
        }}
      />

      {/* Floating checkmark particles */}
      {FLOATING_CHECKS.map((fc) => (
        <span
          key={`${fc.top}-${fc.left}`}
          aria-hidden
          className="pointer-events-none absolute text-[var(--teal)] opacity-10"
          style={{
            top: fc.top,
            left: fc.left,
            animation: `float ${fc.dur} ease-in-out ${fc.delay}s infinite`,
          }}
        >
          <CheckCircle2 size={16} />
        </span>
      ))}

      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--purple)]">
          <Star size={13} /> Kenapa Spark?
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Dibuat buat kamu yang{" "}
          <span className="text-gradient">pengen beneran paham.</span>
        </h2>
        <p className="mx-auto max-w-[600px] text-sm text-muted-foreground md:text-base">
          Bukan sekadar bikin nilai naik — Spark bantu cara belajarmu jadi lebih
          efektif, konsisten, dan menyenangkan.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-3">
        {keunggulan.map((k, i) => (
          <motion.div
            key={k.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: 0.2 + i * 0.15,
              duration: 0.6,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.02,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className={cn(i === 0 && "lg:row-span-2")}
          >
            <div
              className="clay group relative h-full overflow-hidden p-7"
              style={{
                animation: "border-glow 4s ease-in-out infinite",
              }}
            >
              {/* Hover glow */}
              <div
                aria-hidden
                className="absolute -right-20 -top-20 size-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle, ${k.glowColor}, transparent 70%)`,
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
                className={`mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br ${k.color} text-white shadow-lg transition-shadow duration-300 group-hover:shadow-xl`}
              >
                <k.icon size={22} strokeWidth={2.5} />
              </div>
              <h3 className="mb-3 font-heading text-[18px] font-bold text-foreground">
                {k.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                {k.desc}
              </p>

              {i === 0 && (
                <div className="mt-6 space-y-2.5 border-t border-dashed border-border/40 pt-5">
                  {fiturTambahan.map((f, fi) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        delay: 0.6 + fi * 0.1,
                        duration: 0.4,
                      }}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0 text-[var(--teal)]"
                        strokeWidth={2.5}
                      />
                      <div>
                        <p className="text-[13px] font-bold text-foreground">
                          {f.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated star rating */}
      <Reveal
        delay={120}
        className="mx-auto mt-12 flex max-w-md flex-col items-center gap-2 text-center"
      >
        <div className="flex items-center gap-1">
          {["s1", "s2", "s3", "s4", "s5"].map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{
                delay: 0.8 + i * 0.12,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
            >
              <Star className="size-4 fill-[var(--yellow)] text-[var(--yellow)]" />
            </motion.div>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <MessageCircle size={13} />
          Siap dipakai — gratis, tanpa daftar ribet
        </p>
      </Reveal>
    </section>
  );
}
