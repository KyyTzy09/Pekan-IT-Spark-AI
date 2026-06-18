"use client";

import { Progress } from "@/components/ui/progress";

interface Subject {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  masteryPct: number;
  masteredConcepts: number;
  totalConcepts: number;
  attemptCount: number;
}

export function SubjectProgress({ subjects }: { subjects: Subject[] }) {
  return (
    <section className="space-y-4 md:col-span-7 rounded-3xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <header>
        <h2 className="font-heading text-[16px] font-bold text-foreground">
          Mata Pelajaran yang Sedang Dipelajari
        </h2>
        <p className="text-[12px] text-muted-foreground">
          Tingkat penguasaan anak Anda berdasarkan pengerjaan materi dan kuis
          latihan.
        </p>
      </header>

      <div className="space-y-4.5 mt-4">
        {subjects.map((sub) => (
          <div key={sub.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="grid size-7 place-items-center rounded-lg text-white font-bold text-[12px]"
                  style={{
                    background:
                      sub.color ||
                      "linear-gradient(135deg, var(--blue), var(--teal))",
                  }}
                >
                  {sub.icon ? sub.icon[0] : sub.name[0]}
                </span>
                <span className="text-[13px] font-bold text-foreground leading-none">
                  {sub.name}
                </span>
              </div>
              <span className="text-[12.5px] font-bold text-foreground">
                {sub.masteryPct}%
              </span>
            </div>
            <Progress value={sub.masteryPct} className="h-2 rounded-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
              <span>
                {sub.masteredConcepts} / {sub.totalConcepts} Konsep Tuntas
              </span>
              <span>{sub.attemptCount} Pertanyaan Terjawab</span>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <p className="text-center text-[12.5px] text-muted-foreground py-6">
            Belum ada mata pelajaran yang difokuskan saat ini.
          </p>
        )}
      </div>
    </section>
  );
}
