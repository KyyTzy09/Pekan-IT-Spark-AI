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
    <div className="space-y-5">
      {/* AI info card */}
      <div className="rounded-2xl border border-[var(--purple)]/25 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--pink)]/3 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[13px] font-bold text-[var(--purple)]">
              Spark AI bakal bikin:
            </p>
            <ul className="mt-1.5 space-y-0.5 text-[12px] text-foreground/80">
              {[
                "3-6 topik sesuai mapel",
                "3-6 konsep per topik",
                "5-8 soal pretest",
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="text-[var(--purple)]">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Name input */}
      <div className="relative">
        <label
          htmlFor="subject-name"
          className="mb-1.5 block text-[12px] font-semibold text-foreground/80"
        >
          Nama mapel
        </label>
        <div
          className={cn(
            "group/field relative flex items-center rounded-2xl border bg-input/40 p-1 transition-all focus-within:border-[var(--coral)]/40 focus-within:ring-3 focus-within:ring-[var(--coral)]/15",
            name ? "border-[var(--coral)]/30" : "border-border/40",
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors group-focus-within/field:text-[var(--coral)]">
            <Wand2 size={16} />
          </span>
          <input
            id="subject-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder=" "
            maxLength={60}
            disabled={isGenerating}
            className="h-11 w-full min-w-0 rounded-xl bg-transparent px-2.5 text-[14px] outline-none placeholder:text-transparent disabled:opacity-50"
          />
          <label
            htmlFor="subject-name"
            className={cn(
              "pointer-events-none absolute left-12 px-1 text-[13px] text-muted-foreground transition-all",
              name
                ? "-top-2.5 text-[10px] font-bold text-[var(--coral)]"
                : "top-3",
            )}
          >
            cth: Bahasa Jawa, Coding, Musik...
          </label>
        </div>
      </div>

      {/* Grade/Edu - compact */}
      <div className="grid grid-cols-2 gap-3">
        {/* Education */}
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-foreground/80">
            Jenjang
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["SMA", "SMK"] as const).map((opt) => {
              const active = educationLevel === opt;
              const Icon = opt === "SMA" ? GraduationCap : BookOpen;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onEducationLevelChange(opt)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[12px] font-semibold transition-all active:scale-95",
                    active
                      ? "border-[var(--coral)]/50 bg-[var(--coral)]/10 text-[var(--coral)]"
                      : "border-border/40 bg-card/60 text-foreground/70 hover:bg-card/80",
                  )}
                >
                  <Icon size={13} />
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        {/* Grade */}
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-foreground/80">
            Kelas
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {([10, 11, 12] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGradeChange(g)}
                className={cn(
                  "rounded-xl border py-2 text-center text-[13px] font-bold transition-all active:scale-95",
                  grade === g
                    ? "border-[var(--coral)]/50 bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "border-border/40 bg-card/60 text-foreground/70 hover:bg-card/80",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Context textarea */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="subject-context"
            className="text-[12px] font-semibold text-foreground/80"
          >
            Konteks tambahan
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
          placeholder="Kosongin juga gapapa — AI bakal generate otomatis"
          maxLength={280}
          rows={2}
          disabled={isGenerating}
          className="w-full resize-none rounded-2xl border border-border/40 bg-input/40 px-3.5 py-2.5 text-[13px] leading-relaxed outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:ring-3 focus:ring-[var(--coral)]/15 disabled:opacity-50"
        />
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground">
          Atau pilih ide populer:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_CUSTOM.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onNameChange(s)}
              disabled={isGenerating}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40",
                name === s
                  ? "border-[var(--coral)]/50 bg-[var(--coral)]/10 text-[var(--coral)]"
                  : "border-border/40 bg-card/60 text-foreground/80 hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/5 hover:text-[var(--coral)]",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/8 p-3 text-[12px] text-destructive">
          ⚠️ {error}
        </div>
      )}

      {/* Generating state */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/5 p-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
            <Loader2 size={24} className="animate-spin" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-heading text-[15px] font-bold text-foreground">
              Spark lagi mikir keras...
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Lagi bikin outline & soal pretest buat &quot;{name}&quot;
            </p>
          </div>
          <div className="flex gap-1.5">
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
