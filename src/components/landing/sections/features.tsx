import {
  Brain,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Upload,
} from "lucide-react";
import { Reveal } from "./reveal";

const features = [
  {
    icon: Brain,
    title: "Penjelasan yang pas di level kamu",
    desc: "Spark nyimpen profil kemampuan kamu. Materi yang susah dikasih contoh kontekstual, yang udah dikuasi langsung loncat. Gak ada yang kelewat, gak ada yang kelamaan.",
    color: "from-[var(--purple)] to-[var(--pink)]",
    span: "lg:col-span-2",
  },
  {
    icon: MessageCircle,
    title: "Tanya jawab ala Socratic",
    desc: "Bukan dikasih jawaban langsung. Spark nanya balik biar kamu mikir sendiri dan beneran paham konsepnya.",
    color: "from-[var(--coral)] to-[var(--orange)]",
    span: "lg:row-span-2",
  },
  {
    icon: Target,
    title: "Latihan adaptif",
    desc: "Soal otomatis naik kalau kamu lancar, turun kalau masih struggle.",
    color: "from-[var(--yellow)] to-[var(--orange)]",
    span: "",
  },
  {
    icon: Upload,
    title: "Upload materi guru",
    desc: "Punya PDF atau DOCX dari WhatsApp guru? Spark ubah jadi ringkasan, kuis, atau sesi latihan otomatis.",
    color: "from-[var(--teal)] to-[var(--green)]",
    span: "",
  },
  {
    icon: Trophy,
    title: "Gamifikasi yang sehat",
    desc: "XP, level, streak, dan badge — tanpa FOMO, tanpa energi/hidup. Streak yang putus bukan hukuman, tapi kesempatan untuk mulai lagi.",
    color: "from-[var(--pink)] to-[var(--purple)]",
    span: "lg:col-span-2",
  },
  {
    icon: Sparkles,
    title: "Bintang konsep & skill tree",
    desc: "Visualisasi konstelasi yang nunjukin konsep mana yang udah dikuasi dan apa yang harus dipelajari selanjutnya.",
    color: "from-[var(--blue)] to-[var(--teal)]",
    span: "lg:col-span-2",
  },
];

export function Features() {
  return (
    <section id="fitur" className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--purple)]">
          <Sparkles size={13} /> Fitur Unggulan
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Tujuh kemampuan yang{" "}
          <span className="text-gradient">beneran bantu</span> kamu paham.
        </h2>
        <p className="mx-auto max-w-[600px] text-sm leading-relaxed text-muted-foreground md:text-base">
          Bukan cuma kasih jawaban. Spark bener-bener ngertiin kamu dan nemenin
          proses belajarnya dari awal sampai kamu paham.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={i * 50} className={f.span}>
              <div className="clay group relative h-full overflow-hidden p-6">
                <div
                  aria-hidden
                  className="absolute -right-12 -top-12 size-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--coral), var(--purple))",
                  }}
                />
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-[0_6px_18px_rgba(0,0,0,0.1)]`}
                >
                  <Icon size={22} strokeWidth={2.3} />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">
                  {f.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
