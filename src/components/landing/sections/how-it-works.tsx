import { Compass, MessageCircle, Target, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";

const steps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Pilih mapel & tanya Spark",
    desc: "Mulai dari materi yang lagi kamu pelajarin. Spark nanya balik dengan metode Socratic biar kamu mikir sendiri.",
    color: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    step: "02",
    icon: Target,
    title: "Latihan soal adaptif",
    desc: "Soal otomatis menyesuaikan kemampuan kamu. Naik tingkat kalau lancar, turun kalau masih struggle.",
    color: "from-[var(--yellow)] to-[var(--orange)]",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Liat progress & raih badge",
    desc: "Bintang konsep nyala, XP nambah, level naik. Streak harian bikin belajar konsisten tanpa tekanan.",
    color: "from-[var(--teal)] to-[var(--green)]",
  },
];

export function HowItWorks() {
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

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.step} delay={i * 80}>
              <div className="clay relative h-full p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-[0_6px_18px_rgba(0,0,0,0.08)]`}
                  >
                    <Icon size={22} strokeWidth={2.3} />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground/15">
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
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
