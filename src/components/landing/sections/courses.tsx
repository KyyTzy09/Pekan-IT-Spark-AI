"use client";

import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  BookText,
  Calculator,
  FlaskConical,
  Globe2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "../../shared/reveal";

const subjects = [
  {
    name: "Topik & Mapel Kustom",
    desc: "Bebas buat mata pelajaran sendiri atau upload materi apa pun. Spark siap bikinkan modul ringkasan, kuis, dan peta belajar interaktif khusus untuk kamu.",
    topics: ["Bahan Ujian", "PDF & Foto", "Catatan Kelas", "Topik Bebas"],
    icon: Sparkles,
    color: "from-[var(--purple)] to-[var(--pink)]",
    tag: "Kustomisasi",
    tagBg: "bg-[color-mix(in_oklch,var(--purple)_12%,transparent)]",
    tagText: "text-[var(--purple)]",
    featured: true,
    emoji: "✨",
  },
  {
    name: "Matematika",
    desc: "Aljabar, trigonometri, kalkulus, statistika — dibahas tanpa bikin pusing.",
    topics: ["Aljabar", "Trigonometri", "Kalkulus", "Statistika"],
    icon: Calculator,
    color: "from-[var(--coral)] to-[var(--orange)]",
    tag: "Mapel favorit",
    tagBg: "bg-[color-mix(in_oklch,var(--coral)_12%,transparent)]",
    tagText: "text-[var(--coral)]",
    emoji: "📐",
  },
  {
    name: "Bahasa Indonesia",
    desc: "Tata bahasa, sastra, menulis esai, sampai memahami teks argumentasi.",
    topics: ["Tata Bahasa", "Sastra", "Esai", "Teks"],
    icon: BookText,
    color: "from-[var(--blue)] to-[var(--teal)]",
    tag: "Bahasa utama",
    tagBg: "bg-[color-mix(in_oklch,var(--blue)_12%,transparent)]",
    tagText: "text-[var(--blue)]",
    emoji: "📖",
  },
  {
    name: "Bahasa Inggris",
    desc: "Grammar, vocabulary, reading, writing — disesuaikan dengan kurikulum.",
    topics: ["Grammar", "Vocabulary", "Reading", "Writing"],
    icon: Globe2,
    color: "from-[var(--teal)] to-[var(--green)]",
    tag: "Internasional",
    tagBg: "bg-[color-mix(in_oklch,var(--teal)_12%,transparent)]",
    tagText: "text-[var(--teal)]",
    emoji: "🌏",
  },
  {
    name: "IPA Terpadu",
    desc: "Fisika, Kimia, Biologi — konsep sains yang dikaitkan sama kehidupan nyata.",
    topics: ["Fisika", "Kimia", "Biologi", "Sains Terapan"],
    icon: FlaskConical,
    color: "from-[var(--yellow)] to-[var(--orange)]",
    tag: "Sains terpadu",
    tagBg: "bg-[color-mix(in_oklch,var(--yellow)_14%,transparent)]",
    tagText: "text-foreground",
    emoji: "🔬",
  },
];

export function Courses() {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "-80px" });

  return (
    <section id="katalog" className="container-px py-16 md:py-24">
      <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
            <BookOpen size={13} /> Kurikulum & Topik
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-[44px]">
            Dukung mapel inti &{" "}
            <span className="text-gradient">topik kustom</span> buatanmu.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Mulai dari materi sekolah yang mengikuti Kurikulum Merdeka hingga
            topik belajar apa pun yang ingin kamu buat sendiri secara kustom.
          </p>
        </div>
      </Reveal>

      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal
              key={s.name}
              delay={i * 60}
              className={s.featured ? "lg:col-span-2" : ""}
            >
              <motion.article
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
                className={cn(
                  "clay group relative h-full overflow-hidden p-6",
                  s.featured && "sm:p-8",
                )}
                style={{
                  animation: s.featured
                    ? "card-float 8s ease-in-out infinite"
                    : undefined,
                }}
              >
                {/* Floating emoji decoration */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute select-none text-2xl opacity-[0.08]"
                  style={{
                    top: s.featured ? "12%" : "10%",
                    right: s.featured ? "8%" : "6%",
                    animation: `float ${6 + i}s ease-in-out ${i * 0.5}s infinite`,
                  }}
                >
                  {s.emoji}
                </span>

                {/* Hover shine sweep */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
                  }}
                />

                {s.featured && (
                  <div
                    aria-hidden
                    className="absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--purple), var(--pink))",
                    }}
                  />
                )}
                <div className="relative flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-shadow duration-300 group-hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)] ${
                        s.featured ? "h-16 w-16" : "h-14 w-14"
                      }`}
                    >
                      <Icon size={s.featured ? 30 : 26} strokeWidth={2.2} />
                    </motion.div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.tagBg} ${s.tagText}`}
                    >
                      <GraduationCap size={11} />
                      {s.tag}
                    </span>
                  </div>
                  <h3
                    className={`mb-2 font-heading font-bold text-foreground ${
                      s.featured ? "text-3xl" : "text-xl"
                    }`}
                  >
                    {s.name}
                  </h3>
                  <p
                    className={`mb-4 text-muted-foreground ${
                      s.featured ? "text-sm md:text-base" : "text-[13px]"
                    }`}
                  >
                    {s.desc}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {s.topics.map((t, ti) => (
                      <motion.span
                        key={t}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{
                          delay: 0.3 + i * 0.1 + ti * 0.08,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground/80"
                      >
                        {t}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
