import {
  BookOpen,
  GraduationCap,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6">
      {/* AI info card */}
      <div className="rounded-xl border border-[var(--purple)]/30 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--pink)]/3 p-5">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <div className="flex-1">
            <p className="font-heading text-[15px] font-bold text-[var(--purple)]">
              Spark AI bakal bikin:
            </p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-foreground/80">
              {[
                "3-6 topik sesuai mapel",
                "3-6 konsep per topik",
                "5-8 soal pretest",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[var(--purple)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Name input */}
      <section>
        <label
          htmlFor="subject-name"
          className="mb-2 block text-[13px] font-bold text-foreground"
        >
          Nama mapel
        </label>
        <div
          className={cn(
            "relative flex items-center rounded-xl border-2 bg-card/80 px-1 transition-all duration-200",
            name
              ? "border-[var(--coral)]/50 ring-4 ring-[var(--coral)]/5"
              : "border-border/60 focus-within:border-[var(--coral)] focus-within:ring-4 focus-within:ring-[var(--coral)]/10",
          )}
        >
          <span className="grid size-11 shrink-0 place-items-center text-muted-foreground">
            <Wand2 size={18} />
          </span>
          <input
            id="subject-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Contoh: Bahasa Jawa, Coding, Musik..."
            maxLength={60}
            disabled={isGenerating}
            className="h-12 w-full bg-transparent pr-4 text-[15px] outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
        </div>
      </section>

      {/* Education & Grade */}
      <div className="grid grid-cols-2 gap-4">
        <section>
          <label className="mb-2 block text-[13px] font-bold text-foreground">
            Jenjang
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["SMA", "SMK"] as const).map((opt) => {
              const active = educationLevel === opt;
              const Icon = opt === "SMA" ? GraduationCap : BookOpen;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onEducationLevelChange(opt)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-[13px] font-bold transition-all active:scale-95",
                    active
                      ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)] ring-4 ring-[var(--coral)]/10"
                      : "border-border/60 bg-card/80 text-foreground/70 hover:border-border",
                  )}
                >
                  <Icon size={15} />
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-[13px] font-bold text-foreground">
            Kelas
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([10, 11, 12] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGradeChange(g)}
                className={cn(
                  "rounded-lg border-2 py-2.5 text-center text-[14px] font-bold transition-all active:scale-95",
                  grade === g
                    ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)] ring-4 ring-[var(--coral)]/10"
                    : "border-border/60 bg-card/80 text-foreground/70 hover:border-border",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Context textarea */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="subject-context"
            className="text-[13px] font-bold text-foreground"
          >
            Konteks tambahan
          </label>
          <span
            className={cn(
              "text-[11px] font-bold tabular-nums",
              charLeft < 30 ? "text-[var(--coral)]" : "text-muted-foreground",
            )}
          >
            {charLeft} karakter
          </span>
        </div>
        <textarea
          id="subject-context"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Opsional - kasih tau Spark fokus yang kamu mau"
          maxLength={280}
          rows={3}
          disabled={isGenerating}
          className="w-full resize-none rounded-xl border-2 border-border/60 bg-card/80 px-4 py-3 text-[14px] leading-relaxed outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/10 disabled:opacity-50"
        />
      </section>

      {/* Suggestions */}
      <section>
        <p className="mb-3 text-[12px] font-semibold text-muted-foreground">
          Atau pilih ide populer:
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CUSTOM.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onNameChange(s)}
              disabled={isGenerating}
              className={cn(
                "rounded-full border-2 px-4 py-2 text-[12px] font-bold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40",
                name === s
                  ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)] ring-4 ring-[var(--coral)]/10"
                  : "border-border/60 bg-card/80 text-foreground/80 hover:border-[var(--coral)]/50 hover:bg-[var(--coral)]/5",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border-2 border-destructive/40 bg-destructive/8 p-4 text-[13px] leading-relaxed text-destructive">
          ⚠️ {error}
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-[var(--purple)]/30 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--pink)]/5 p-8 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
            <Loader2 size={28} className="animate-spin" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-heading text-[17px] font-bold text-foreground">
              Spark lagi mikir keras...
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Lagi bikin outline & soal pretest buat &quot;{name}&quot;
            </p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2.5 animate-bounce rounded-full bg-[var(--purple)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
