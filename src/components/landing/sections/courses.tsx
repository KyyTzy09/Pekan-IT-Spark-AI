import {
  ArrowRight,
  BookOpen,
  BookText,
  Calculator,
  FlaskConical,
  Globe2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Reveal } from "../../shared/reveal";

const subjects = [
  {
    name: "Matematika",
    desc: "Aljabar, trigonometri, kalkulus, statistika — dibahas tanpa bikin pusing.",
    topics: ["Aljabar", "Trigonometri", "Kalkulus", "Statistika"],
    icon: Calculator,
    color: "from-[var(--coral)] to-[var(--orange)]",
    tag: "Mapel favorit",
    tagBg: "bg-[color-mix(in_oklch,var(--coral)_12%,transparent)]",
    tagText: "text-[var(--coral)]",
    featured: true,
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
  },
];

export function Courses() {
  return (
    <section id="katalog" className="container-px py-16 md:py-24">
      <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
            <BookOpen size={13} /> Mata Pelajaran
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-[44px]">
            Empat mapel inti,{" "}
            <span className="text-gradient">ribuan konsep</span> siap dibahas.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Mulai dari materi yang kamu lagi pelajarin di sekolah. Spark
            ngikutin Kurikulum Merdeka — topiknya selalu relevan dengan kelas
            kamu.
          </p>
        </div>
        <Link
          href="/subjects"
          className="group inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
        >
          Lihat semua kursus
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.name} delay={i * 60}>
              <article
                className={cn(
                  "clay group relative h-full overflow-hidden p-6",
                  s.featured && "sm:col-span-2 sm:row-span-2 sm:p-8",
                )}
              >
                {s.featured && (
                  <div
                    aria-hidden
                    className="absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--coral), var(--orange))",
                    }}
                  />
                )}
                <div className="relative flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div
                      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-[0_6px_20px_rgba(0,0,0,0.1)] ${
                        s.featured ? "h-16 w-16" : "h-14 w-14"
                      }`}
                    >
                      <Icon size={s.featured ? 30 : 26} strokeWidth={2.2} />
                    </div>
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
                    {s.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {s.featured && (
                    <div className="mt-5 flex items-center gap-2 text-[13px] font-bold text-[var(--coral)]">
                      Mulai belajar
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
