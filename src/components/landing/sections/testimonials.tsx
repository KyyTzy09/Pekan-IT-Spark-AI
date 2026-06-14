import { MessageCircle, Quote, Star } from "lucide-react";
import { Reveal } from "./reveal";

const featured = {
  quote:
    "Dulu aku malu nanya ke guru kalau gak ngerti. Pake Spark, aku bisa nanya kapan aja tanpa dihakimi. Nilai matematika aku naik dari 70 ke 85, dan sekarang aku malah bantu temen-temen yang lain.",
  name: "Rina Aulia",
  role: "Kelas 11 SMK • TKJ",
  initials: "RA",
  color: "from-[var(--coral)] to-[var(--orange)]",
  rating: 5,
};

const testimonials = [
  {
    quote:
      "Yang aku suka, Spark gak langsung kasih jawaban. Dia nanya balik dulu, jadi aku mikir sendiri. Belajarnya jadi nempel di otak.",
    name: "Bagas Pratama",
    role: "Kelas 10 SMA",
    initials: "BP",
    color: "from-[var(--teal)] to-[var(--green)]",
  },
  {
    quote:
      "Aku upload PDF rangkuman dari guru, terus Spark bikinin kuis otomatis. PR selesai dalam 20 menit dan aku beneran paham materinya.",
    name: "Salsabila P.",
    role: "Kelas 12 SMA",
    initials: "SP",
    color: "from-[var(--yellow)] to-[var(--orange)]",
  },
  {
    quote:
      "Sebagai anak daerah 3T, guru les privat susah banget dicari. Spark kayak punya guru privat sendiri yang bisa diajak ngobrol 24 jam.",
    name: "Yosua M.",
    role: "Kelas 11 SMK",
    initials: "YM",
    color: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    quote:
      "Streak-nya ngebantu banget buat konsisten. Aku jadi belajar setiap hari walau cuma 15 menit. Nagih positif!",
    name: "Aisha R.",
    role: "Kelas 10 SMA",
    initials: "AR",
    color: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    quote:
      "Aku tipe yang cepet bosen. Tapi Spark kasih variasi — kadang latihan, kadang ngobrol, kadang kuis. Gak monoton.",
    name: "Dimas A.",
    role: "Kelas 12 SMK",
    initials: "DA",
    color: "from-[var(--pink)] to-[var(--purple)]",
  },
];

export function Testimonials() {
  return (
    <section id="cerita" className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--purple)]">
          <Star size={13} /> Cerita Siswa
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Ribuan siswa udah{" "}
          <span className="text-gradient">ngerasain bedanya.</span>
        </h2>
        <p className="mx-auto max-w-[600px] text-sm text-muted-foreground md:text-base">
          Bukan cuma nilai yang naik — tapi cara belajar mereka yang berubah
          jadi lebih pede dan seru.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-3">
        <Reveal className="lg:row-span-2">
          <figure className="clay relative h-full overflow-hidden p-7">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 size-48 rounded-full opacity-20 blur-3xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--coral), var(--orange))",
              }}
            />
            <Quote className="relative mb-4 size-8 text-[var(--coral)]" />
            <div
              className="mb-4 flex items-center gap-0.5"
              aria-label="Rating 5 dari 5"
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  className="size-4 fill-[var(--yellow)] text-[var(--yellow)]"
                />
              ))}
            </div>
            <blockquote className="relative mb-6 text-[15px] leading-relaxed text-foreground/85">
              {featured.quote}
            </blockquote>
            <figcaption className="relative flex items-center gap-3 border-t border-dashed border-border/60 pt-5">
              <div
                className={`grid size-12 place-items-center rounded-full bg-gradient-to-br ${featured.color} text-sm font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]`}
                aria-hidden
              >
                {featured.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {featured.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {featured.role}
                </p>
              </div>
            </figcaption>
          </figure>
        </Reveal>

        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 50} className="lg:col-span-1">
            <figure className="clay h-full p-5">
              <div className="mb-3 flex items-center justify-between">
                <Quote className="size-6 text-[var(--coral)]" />
                <div className="flex items-center gap-0.5" aria-label="Rating 5 dari 5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="size-3 fill-[var(--yellow)] text-[var(--yellow)]"
                    />
                  ))}
                </div>
              </div>
              <blockquote className="mb-4 text-[13px] leading-relaxed text-foreground/85">
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-dashed border-border/60 pt-4">
                <div
                  className={`grid size-9 place-items-center rounded-full bg-gradient-to-br ${t.color} text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
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
          <span className="ml-2 font-heading text-base font-bold text-foreground">
            4.9 / 5.0
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <MessageCircle size={13} />
          Dari 12.000+ siswa aktif di seluruh Indonesia
        </p>
      </Reveal>
    </section>
  );
}
