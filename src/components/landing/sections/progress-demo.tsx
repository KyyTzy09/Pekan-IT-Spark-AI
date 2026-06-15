import {
  CheckCircle2,
  Flame,
  GraduationCap,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Reveal } from "./reveal";

const subjectProgress = [
  {
    name: "Matematika",
    value: 78,
    color: "from-[var(--coral)] to-[var(--orange)]",
    topics: "12/15 konsep",
  },
  {
    name: "Bahasa Indonesia",
    value: 92,
    color: "from-[var(--blue)] to-[var(--teal)]",
    topics: "23/25 konsep",
  },
  {
    name: "Bahasa Inggris",
    value: 64,
    color: "from-[var(--teal)] to-[var(--green)]",
    topics: "16/25 konsep",
  },
  {
    name: "IPA",
    value: 41,
    color: "from-[var(--yellow)] to-[var(--orange)]",
    topics: "8/20 konsep",
  },
];

const recentBadges = [
  {
    name: "Penakluk Aljabar",
    icon: Trophy,
    color: "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)]",
  },
  {
    name: "Streak 7 Hari",
    icon: Flame,
    color: "bg-gradient-to-br from-[var(--yellow)] to-[var(--orange)]",
  },
  {
    name: "Penanya Ulung",
    icon: Sparkles,
    color: "bg-gradient-to-br from-[var(--teal)] to-[var(--green)]",
  },
];

export function ProgressDemo() {
  return (
    <section id="progress" className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--pink)_22%,transparent)] bg-[color-mix(in_oklch,var(--pink)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--pink)]">
          <Trophy size={13} /> Progress Tracking
        </div>
        <h2 className="mb-3 font-heading text-3xl font-bold tracking-tight md:text-[44px]">
          Liat sendiri <span className="text-gradient">seberapa jauh</span> kamu
          udah jalan.
        </h2>
        <p className="mx-auto max-w-[600px] text-sm text-muted-foreground md:text-base">
          Dashboard yang nunjukin progress per mapel, streak harian, level, dan
          badge — semua dikemas biar kamu semangat terus.
        </p>
      </Reveal>

      <Reveal
        delay={80}
        className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3"
      >
        <div className="clay p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Progress per Mata Pelajaran
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Semester ini
            </span>
          </div>
          <div className="space-y-5">
            {subjectProgress.map((s) => (
              <div key={s.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">{s.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {s.topics} • {s.value}%
                  </span>
                </div>
                <div
                  className="relative h-3 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={s.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={s.name}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="clay bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl border border-white/30 bg-white/20">
                <Flame size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  Streak
                </p>
                <p className="font-heading text-2xl font-bold leading-none">
                  7 hari
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] font-semibold opacity-90">
              Konsisten 1 minggu berturut-turut. Streak freeze mingguan udah
              aktif.
            </p>
          </div>

          <div className="clay bg-gradient-to-br from-[var(--yellow)] to-[var(--orange)] p-6 text-foreground">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl border border-foreground/10 bg-white/30">
                <Zap size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Level
                </p>
                <p className="font-heading text-2xl font-bold leading-none">
                  Pejuang
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] font-semibold opacity-80">
              1.240 / 2.000 XP menuju level Ahli.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: "62%" }}
              />
            </div>
          </div>
        </div>

        <div className="clay p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Badge Terbaru
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Lihat semua
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recentBadges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.name}
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 transition-all hover:-translate-y-0.5"
                >
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${b.color}`}
                  >
                    <Icon size={20} strokeWidth={2.3} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">
                      {b.name}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Baru aja didapet
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal
        delay={140}
        className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-semibold text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-[var(--teal)]" /> Tanpa
          batasan energi
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-[var(--teal)]" /> Streak bukan
          hukuman
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-[var(--teal)]" /> Reward
          transparan
        </span>
        <span className="flex items-center gap-1.5">
          <GraduationCap size={14} className="text-[var(--coral)]" /> No
          pay-to-win
        </span>
      </Reveal>
    </section>
  );
}
