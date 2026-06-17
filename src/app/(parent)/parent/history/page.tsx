import {
  BookOpen,
  Calendar,
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getParentHistoryData } from "@/server/actions/parent";

const DAYS_INDONESIAN = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTHS_INDONESIAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDateKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLongDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS_INDONESIAN[d.getDay()]}, ${d.getDate()} ${MONTHS_INDONESIAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const metadata: Metadata = {
  title: "Riwayat Aktivitas — Spark Ai",
  description: "Pantau riwayat aktivitas belajar anak Anda.",
};

export default async function ParentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string; days?: string }>;
}) {
  const { childId, days = "30" } = await searchParams;
  const daysNum = parseInt(days, 10);

  const result = await getParentHistoryData(childId, daysNum);

  if (!result.ok) {
    redirect("/auth/login");
  }

  const { children = [], activeChild, history = [] } = result;

  if (children.length === 0 || !activeChild) {
    redirect("/parent");
  }

  const groupedByDate = history.reduce(
    (acc, item) => {
      const dateKey = formatDateKey(item.date);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    },
    {} as Record<string, typeof history>,
  );

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "challenge":
        return Target;
      case "practice":
        return TrendingUp;
      case "chat":
        return MessageSquare;
      case "material":
        return BookOpen;
      default:
        return Calendar;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "challenge":
        return "from-blue-500 to-cyan-500";
      case "practice":
        return "from-emerald-500 to-teal-500";
      case "chat":
        return "from-purple-500 to-pink-500";
      case "material":
        return "from-orange-500 to-red-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "challenge":
        return "Tantangan";
      case "practice":
        return "Latihan";
      case "chat":
        return "Diskusi";
      case "material":
        return "Materi";
      default:
        return "Aktivitas";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-5">
        <div>
          <h1 className="font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
            Riwayat Aktivitas
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Pantau perjalanan belajar{" "}
            <span className="font-bold text-foreground/80">
              {activeChild.name}
            </span>{" "}
            dalam {daysNum} hari terakhir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {children.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-card/65 p-1 border border-border/30 backdrop-blur-sm">
              {children.map((c) => {
                const active = c.id === activeChild.id;
                return (
                  <Link
                    key={c.id}
                    href={`/parent/history?childId=${c.id}&days=${daysNum}`}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition-all",
                      active
                        ? "bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {(c.name || "Anak").split(" ")[0]}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center gap-2">
        {[7, 14, 30, 60].map((d) => (
          <Button
            key={d}
            asChild
            variant={daysNum === d ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-xl font-bold text-[12px]",
              daysNum === d &&
                "bg-gradient-to-r from-[var(--blue)] to-[var(--teal)]",
            )}
          >
            <Link href={`/parent/history?childId=${childId || ""}&days=${d}`}>
              {d} Hari
            </Link>
          </Button>
        ))}
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl border border-border/40 bg-card/50 p-12 text-center backdrop-blur-xl">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 mb-4">
            <Calendar className="size-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-[18px] font-bold text-foreground mb-2">
            Belum Ada Aktivitas
          </h2>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            {activeChild.name} belum memiliki aktivitas belajar dalam {daysNum}{" "}
            hari terakhir. Yuk, ajak anak untuk mulai belajar!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const items = groupedByDate[dateKey];
            const isToday = dateKey === getTodayKey();
            const isYesterday = dateKey === getYesterdayKey();

            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="font-heading text-[14px] font-bold text-foreground">
                        {isToday
                          ? "Hari Ini"
                          : isYesterday
                            ? "Kemarin"
                            : formatLongDate(dateKey)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {items.length} aktivitas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-border/40">
                  {items.map((item) => {
                    const Icon = getTypeIcon(item.type);
                    const colorClass = getTypeColor(item.type);
                    const label = getTypeLabel(item.type);

                    return (
                      <div
                        key={item.id}
                        className="group relative rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-xl transition-all hover:bg-card/80 hover:border-border/60"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md",
                              colorClass,
                            )}
                          >
                            <Icon size={18} strokeWidth={2.5} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-heading text-[13px] font-bold text-foreground leading-snug">
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                    {label}
                                  </span>
                                  {item.subject && (
                                    <span className="text-[10px] text-muted-foreground font-semibold">
                                      {item.subject}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {item.score !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[16px] font-extrabold text-foreground">
                                      {item.score}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                      %
                                    </span>
                                  </div>
                                )}
                                {item.duration && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock size={10} />
                                    <span className="text-[10px] font-semibold">
                                      {Math.round(item.duration / 60)}m
                                    </span>
                                  </div>
                                )}
                                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                  {formatTime(item.date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
