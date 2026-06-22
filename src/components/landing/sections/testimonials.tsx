import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import { Reveal } from "../../shared/reveal";

const keunggulan = [
  {
    icon: CheckCircle2,
    title: "Belajar Adaptif",
    desc: "Materi dan soal menyesuaikan level pemahaman kamu — bukan sekadar soal acak. Makin sering kamu jawab, makin tepat rekomendasi belajarnya.",
    color: "from-[var(--teal)] to-[var(--green)]",
  },
  {
    icon: MessageCircle,
    title: "Tutor AI 24/7",
    desc: "Nanya kapan aja, dijawab dengan metode Socratic — bukan dikasih jawaban instan, tapi dituntun nemuin jawabannya sendiri.",
    color: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    icon: Star,
    title: "Gratis Selamanya",
    desc: "Semua fitur bisa dipakai gratis — pretest, latihan soal, progress tracking, sampe upload dokumen. Tanpa batas waktu, tanpa iklan.",
    color: "from-[var(--purple)] to-[var(--pink)]",
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

export function Testimonials() {
  return (
    <section id="keunggulan" className="container-px py-16 md:py-24">
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
          <Reveal
            key={k.title}
            delay={i * 80}
            className={i === 0 ? "lg:row-span-2" : ""}
          >
            <div className="clay relative h-full overflow-hidden p-7">
              <div
                aria-hidden
                className="absolute -right-20 -top-20 size-48 rounded-full opacity-10 blur-3xl"
                style={{
                  background: `linear-gradient(135deg, var(--${k.color.includes("teal") ? "teal" : k.color.includes("coral") ? "coral" : "purple"}), var(--orange))`,
                }}
              />
              <div
                className={`mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br ${k.color} text-white shadow-lg`}
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
                  {fiturTambahan.map((f) => (
                    <div key={f.title} className="flex items-start gap-2.5">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal
        delay={120}
        className="mx-auto mt-12 flex max-w-md flex-col items-center gap-2 text-center"
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="size-4 fill-[var(--yellow)] text-[var(--yellow)]"
            />
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
