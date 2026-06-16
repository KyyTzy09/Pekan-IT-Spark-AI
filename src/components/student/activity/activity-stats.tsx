import { BookOpen, Calendar, Flame, MessageCircle, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentActivity } from "@/server/actions/activity";

type Props = {
  activity: StudentActivity;
  studentName: string;
  currentLevel: number;
  totalXp: number;
};

export function ActivityStats({
  activity,
  studentName,
  currentLevel,
  totalXp,
}: Props) {
  const firstName = studentName.split(" ")[0] ?? "Teman";
  const byKind = activity.byKind;

  const stats: Array<{
    label: string;
    value: string | number;
    sub?: string;
    icon: typeof Trophy;
    color: string;
  }> = [
    {
      label: "Total aktivitas",
      value: activity.totalActivities,
      sub: `${activity.activeDays} hari aktif`,
      icon: TrendingUp,
      color: "text-[var(--coral)] bg-[var(--coral)]/10",
    },
    {
      label: "Streak saat ini",
      value: activity.currentStreak,
      sub: `terbaik: ${activity.longestStreak} hari`,
      icon: Flame,
      color: "text-amber-600 bg-amber-500/10",
    },
    {
      label: "Level",
      value: currentLevel,
      sub: `${totalXp.toLocaleString("id-ID")} XP total`,
      icon: Trophy,
      color: "text-[var(--purple)] bg-[var(--purple)]/10",
    },
    {
      label: "Hari aktif",
      value: activity.activeDays,
      sub: `dari ${activity.windowDays} hari`,
      icon: Calendar,
      color: "text-[var(--teal)] bg-[var(--teal)]/10",
    },
  ];

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--coral)]">
          Aktivitas kamu
        </p>
        <h1 className="font-heading text-[26px] font-bold leading-tight text-foreground sm:text-[30px]">
          Hai, {firstName}!
        </h1>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {activity.totalActivities === 0
            ? "Yuk mulai petualangan belajarmu. Setiap aksi kecil ngalir ke grafik ini. ✨"
            : `Kamu udah ${activity.totalActivities} aksi dalam ${activity.windowDays} hari terakhir. Konsistensi kecil, dampak besar. 🚀`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <article
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-3.5 shadow-sm backdrop-blur-md"
            >
              <div
                className={cn(
                  "mb-2 grid size-8 place-items-center rounded-xl",
                  s.color,
                )}
              >
                <Icon size={15} />
              </div>
              <p className="font-heading text-[20px] font-extrabold leading-none text-foreground">
                {s.value}
              </p>
              <p className="mt-1 text-[10.5px] font-bold text-foreground">
                {s.label}
              </p>
              {s.sub && (
                <p className="mt-0.5 text-[9.5px] text-muted-foreground">
                  {s.sub}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KindChip icon={Target} color="text-[var(--coral)] bg-[var(--coral)]/10" label="Soal" count={byKind.QUESTION} />
        <KindChip icon={BookOpen} color="text-[var(--teal)] bg-[var(--teal)]/10" label="Materi" count={byKind.MATERIAL} />
        <KindChip icon={MessageCircle} color="text-[var(--purple)] bg-[var(--purple)]/10" label="Refleksi" count={byKind.REFLECTION} />
        <KindChip icon={Trophy} color="text-[var(--pink)] bg-[var(--pink)]/10" label="Tantangan" count={byKind.CHALLENGE} />
      </div>
    </section>
  );
}

function KindChip({
  icon: Icon,
  color,
  label,
  count,
}: {
  icon: typeof Target;
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/40 p-2.5">
      <div className={cn("grid size-7 place-items-center rounded-lg", color)}>
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          {count} aktivitas
        </p>
      </div>
    </div>
  );
}
