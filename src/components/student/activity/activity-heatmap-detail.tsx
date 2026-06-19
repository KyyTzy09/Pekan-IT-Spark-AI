"use client";

import {
  Award,
  BookOpen,
  Flame,
  MessageCircle,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const PREVIEW_LIMIT = 5;

function longDateLabel(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  date: string;
  entries: ActivityEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ActivityHeatmapDetail({
  date,
  entries,
  open,
  onOpenChange,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => e.timestamp.startsWith(date))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [entries, date]);

  const byKind = useMemo(() => {
    const counts: Partial<Record<ActivityKind, number>> = {};
    for (const e of dayEntries) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    }
    return counts;
  }, [dayEntries]);

  const visible = showAll ? dayEntries : dayEntries.slice(0, PREVIEW_LIMIT);
  const hasMore = dayEntries.length > PREVIEW_LIMIT;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{longDateLabel(date)}</DialogTitle>
          <DialogDescription>{dayEntries.length} aktivitas</DialogDescription>
        </DialogHeader>

        {dayEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada aktivitas di hari ini.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(byKind) as ActivityKind[]).map((kind) => {
                const meta = KIND_META[kind];
                const count = byKind[kind] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={kind}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      meta.color,
                    )}
                  >
                    <meta.icon size={12} />
                    {meta.label} {count}
                  </div>
                );
              })}
            </div>

            <ol className="space-y-2">
              {visible.map((e) => {
                const meta = KIND_META[e.kind];
                const Icon = meta.icon;
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/60 p-3"
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

            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua ${dayEntries.length} aktivitas`}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
