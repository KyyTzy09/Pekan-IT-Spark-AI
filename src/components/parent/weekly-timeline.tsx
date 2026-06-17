"use client";

import { Calendar } from "lucide-react";
import { WeeklyChart } from "@/components/parent/weekly-chart";

interface TimelinePoint {
  date: string;
  overallScore: number;
  masteryScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
}

const DAYS_INDONESIAN = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getDayName(dateStr: string) {
  const d = new Date(dateStr);
  return DAYS_INDONESIAN[d.getDay()] || dateStr;
}

export function WeeklyTimeline({
  timeline,
  childName,
}: {
  timeline: { points: TimelinePoint[] };
  childName: string | null;
}) {
  if (!timeline || timeline.points.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6 space-y-6">
      <header>
        <h2 className="font-heading text-[16px] font-bold text-foreground">
          Aktivitas Belajar 7 Hari Terakhir
        </h2>
        <p className="text-[12px] text-muted-foreground">
          Tren keaktifan harian dan rincian pengerjaan tantangan oleh{" "}
          {childName}.
        </p>
      </header>

      <div className="bg-background/25 rounded-2xl border border-border/20 p-3 sm:p-4">
        <WeeklyChart points={timeline.points} />
      </div>

      <div className="space-y-3">
        <h3 className="text-[12px] font-bold text-foreground/80">
          Rincian Aktivitas Harian
        </h3>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {timeline.points.slice(-7).map((pt) => (
            <div
              key={pt.date}
              className="flex flex-col items-center rounded-2xl border border-border/30 bg-background/45 p-2 sm:p-3 transition-colors hover:bg-background/80"
            >
              <span className="text-[11px] font-bold text-muted-foreground">
                {getDayName(pt.date)}
              </span>

              {/* Visual score ring */}
              <div className="relative my-3 flex size-10 items-center justify-center sm:size-12">
                <svg className="absolute size-full -rotate-90">
                  <title>Skor Keaktifan Harian</title>
                  <circle
                    cx="50%"
                    cy="50%"
                    r="16"
                    className="stroke-muted/30 fill-none"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="16"
                    className="stroke-[var(--blue)] fill-none transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray="100.5"
                    strokeDashoffset={
                      100.5 - (pt.overallScore / 100) * 100.5
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[11px] font-bold tabular-nums text-foreground">
                  {pt.overallScore}
                </span>
              </div>

              {/* Sub-scores icons indicating completions */}
              <div className="flex gap-1">
                <span
                  title="Soal Harian"
                  className={`size-1.5 rounded-full ${
                    pt.challengeScore > 0 ? "bg-[var(--blue)]" : "bg-muted/40"
                  }`}
                />
                <span
                  title="Materi Baca"
                  className={`size-1.5 rounded-full ${
                    pt.materialsScore > 0 ? "bg-[var(--yellow)]" : "bg-muted/40"
                  }`}
                />
                <span
                  title="Refleksi Diri"
                  className={`size-1.5 rounded-full ${
                    pt.reflectionsScore > 0 ? "bg-[var(--coral)]" : "bg-muted/40"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 border-t border-border/20 pt-3 text-[10.5px] text-muted-foreground font-semibold">
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[var(--blue)]" /> Soal
            Terjawab
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[var(--yellow)]" />{" "}
            Materi Dibaca
          </div>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[var(--coral)]" />{" "}
            Refleksi Terkirim
          </div>
        </div>
      </div>
    </section>
  );
}
