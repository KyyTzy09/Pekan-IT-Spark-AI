import {
  Award,
  BookOpen,
  Flame,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry, ActivityKind } from "@/server/actions/activity";

const KIND_META: Record<
  ActivityKind,
  { icon: typeof Trophy; color: string; label: string }
> = {
  QUESTION: {
    icon: Target,
    color: "text-[var(--coral)] bg-[var(--coral)]/10",
    label: "Soal",
  },
  MATERIAL: {
    icon: BookOpen,
    color: "text-[var(--teal)] bg-[var(--teal)]/10",
    label: "Materi",
  },
  REFLECTION: {
    icon: MessageCircle,
    color: "text-[var(--purple)] bg-[var(--purple)]/10",
    label: "Refleksi",
  },
  CHAT: {
    icon: MessageCircle,
    color: "text-[var(--orange)] bg-[var(--orange)]/10",
    label: "Chat",
  },
  BADGE: {
    icon: Award,
    color: "text-amber-600 bg-amber-500/10",
    label: "Badge",
  },
  STREAK: {
    icon: Flame,
    color: "text-amber-600 bg-amber-500/10",
    label: "Streak",
  },
  CHALLENGE: {
    icon: Trophy,
    color: "text-[var(--pink)] bg-[var(--pink)]/10",
    label: "Tantangan",
  },
};

type Props = {
  entries: ActivityEntry[];
  className?: string;
  limit?: number;
};

export function ActivityList({ entries, className, limit = 20 }: Props) {
  const visible = entries.slice(0, limit);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-8 text-center">
        <Sparkles className="mx-auto mb-2 text-[var(--coral)]" size={24} />
        <p className="text-[13px] font-semibold text-foreground">
          Belum ada aktivitas
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          Mulai dengan menjawab soal atau membaca materi.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[15px] font-bold text-foreground">
          Aktivitas terbaru
        </h3>
        {entries.length > limit && (
          <span className="text-[10.5px] text-muted-foreground">
            {limit} dari {entries.length}
          </span>
        )}
      </div>

      <div className="lg:max-h-[360px] lg:overflow-y-auto pr-1 custom-scrollbar">
        <ol className="space-y-2">
          {visible.map((e) => {
            const meta = KIND_META[e.kind];
            const Icon = meta.icon;
            return (
              <li
                key={e.id}
                className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 transition-all hover:border-border/70 hover:bg-card/80"
              >
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    meta.color,
                  )}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[12.5px] font-bold text-foreground">
                      {e.title}
                    </p>
                    <time
                      dateTime={e.timestamp}
                      className="shrink-0 text-[10px] font-medium text-muted-foreground"
                    >
                      {formatDistanceToNow(new Date(e.timestamp))}
                    </time>
                  </div>
                  {e.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                        meta.color,
                      )}
                    >
                      {meta.label}
                    </span>
                    {e.subjectName && (
                      <span className="text-[10px] text-muted-foreground">
                        {e.subjectName}
                      </span>
                    )}
                    {e.xp > 0 && (
                      <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        +{e.xp} XP
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
