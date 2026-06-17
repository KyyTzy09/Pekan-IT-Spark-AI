import { Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EducationLevel } from "./ProfileStep";

const SUGGESTED_CUSTOM = [
  "Bahasa Jawa",
  "Bahasa Arab",
  "Coding",
  "Desain Grafis",
  "Musik",
  "Fotografi",
  "Public Speaking",
  "Bahasa Korea",
];

export function CustomSubjectStep({
  name,
  context,
  educationLevel,
  grade,
  onNameChange,
  onContextChange,
  onEducationLevelChange,
  onGradeChange,
  isGenerating,
  error,
}: {
  name: string;
  context: string;
  educationLevel: EducationLevel;
  grade: number;
  onNameChange: (v: string) => void;
  onContextChange: (v: string) => void;
  onEducationLevelChange: (v: EducationLevel) => void;
  onGradeChange: (v: number) => void;
  isGenerating: boolean;
  error: string | null;
}) {
  const charLeft = 280 - context.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/5 p-3.5 text-[12px] leading-relaxed text-foreground/80">
        <p className="font-bold text-[var(--purple)]">🪄 Spark AI bakal:</p>
        <ul className="mt-1.5 space-y-1 pl-4">
          <li>• Bikin 3-6 topik sesuai mapel kamu</li>
          <li>• Generate 3-6 konsep per topik</li>
          <li>• Bikin 5-8 soal pretest untuk ukur kemampuan awal</li>
        </ul>
      </div>

      <div>
        <label
          htmlFor="subject-name"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Nama mapel
        </label>
        <input
          id="subject-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth: Bahasa Jawa, Coding, Musik…"
          maxLength={60}
          disabled={isGenerating}
          className="mt-1.5 h-11 w-full rounded-2xl border border-border/50 bg-background/70 px-4 text-[14px] font-semibold backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/15 disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Jenjang
          </label>
          <div className="mt-1.5 flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
            {(["SMA", "SMK"] as const).map((opt) => {
              const active = educationLevel === opt;
              return (
                <label
                  key={opt}
                  htmlFor={`cs-edu-${opt}`}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                      : "text-foreground/70 hover:bg-muted/60",
                  )}
                >
                  <input
                    id={`cs-edu-${opt}`}
                    type="radio"
                    name="csEducationLevel"
                    value={opt}
                    checked={active}
                    onChange={() => onEducationLevelChange(opt)}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Kelas
          </label>
          <div className="mt-1.5 flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
            {([10, 11, 12] as const).map((g) => {
              const active = grade === g;
              return (
                <label
                  key={g}
                  htmlFor={`cs-grade-${g}`}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                      : "text-foreground/70 hover:bg-muted/60",
                  )}
                >
                  <input
                    id={`cs-grade-${g}`}
                    type="radio"
                    name="csGrade"
                    value={g}
                    checked={active}
                    onChange={() => onGradeChange(g)}
                    className="sr-only"
                  />
                  {g}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="subject-context"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Konteks tambahan (opsional)
          </label>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              charLeft < 30 ? "text-[var(--coral)]" : "text-muted-foreground",
            )}
          >
            {charLeft}
          </span>
        </div>
        <textarea
          id="subject-context"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Bisa kasih tau Spark ini mapel tentang apa, level kamu, atau fokus yang kamu mau. Boleh kosong."
          maxLength={280}
          rows={3}
          disabled={isGenerating}
          className="mt-1.5 w-full resize-none rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 text-[13px] font-medium leading-relaxed backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/15 disabled:opacity-50"
        />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Atau pilih ide populer:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_CUSTOM.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onNameChange(s)}
              disabled={isGenerating}
              className="rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11.5px] font-bold text-foreground/85 transition-all hover:-translate-y-0.5 hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/8 hover:text-[var(--coral)] disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[var(--coral)]/30 bg-[var(--coral)]/8 p-3 text-[12px] leading-relaxed text-[var(--coral)]">
          ⚠️ {error}
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/5 p-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
            <Loader2 size={24} className="animate-spin" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-heading text-[15px] font-bold text-foreground">
              Spark lagi mikir keras…
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Lagi bikin outline & soal pretest buat mapel &quot;{name}&quot;.
            </p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2 animate-bounce rounded-full bg-[var(--purple)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
