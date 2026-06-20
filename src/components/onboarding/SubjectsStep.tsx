import { ArrowRight, Check, Search, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type Subject = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

export function SubjectsStep({
  subjects,
  selected,
  onToggle,
  onOpenSearch,
  onContinue,
}: {
  subjects: Subject[];
  selected: string[];
  onToggle: (id: string) => void;
  onOpenSearch: () => void;
  onContinue: () => void;
}) {
  const selectedSubjects = React.useMemo(
    () => subjects.filter((s) => selected.includes(s.id)),
    [subjects, selected],
  );

  return (
    <div className="space-y-5">
      {/* Selected chips at top */}
      {selected.length > 0 && (
        <div className="rounded-2xl border border-[var(--teal)]/25 bg-[var(--teal)]/5 p-3 backdrop-blur-sm">
          <p className="mb-2 text-[11px] font-semibold text-[var(--teal)]">
            {selected.length} mapel dipilih — tap untuk hapus
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className="flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-3 py-1.5 text-[11.5px] font-bold text-[var(--teal)] transition-all hover:bg-[var(--teal)]/25 active:scale-95"
              >
                <span className="text-[13px]">{s.icon ?? "📚"}</span>
                {s.name}
                <X size={12} strokeWidth={2.5} className="opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {subjects.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(s.id)}
              className={cn(
                "group/sub relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.97]",
                active
                  ? "border-transparent bg-gradient-to-br from-[var(--coral)]/10 to-[var(--orange)]/5 shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                  : "border-border/40 bg-card/40 hover:border-border/60 hover:bg-card/70",
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl text-white shadow transition-all duration-300 group-hover/sub:scale-110",
                    active ? "ring-2 ring-white/30" : "",
                  )}
                  style={{
                    background: active
                      ? `linear-gradient(135deg, var(--coral), oklch(0.65 0.15 60))`
                      : s.color
                        ? `linear-gradient(135deg, ${s.color}, oklch(0.6 0.12 60))`
                        : "linear-gradient(135deg, var(--coral)/60, var(--orange)/60)",
                  }}
                >
                  <span className="text-[20px]">{s.icon ?? "📚"}</span>
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="grid size-6 place-items-center rounded-full bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]"
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "font-heading text-[14px] font-bold transition-colors",
                    active ? "text-[var(--coral)]" : "text-foreground/90",
                  )}
                >
                  {s.name}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    active
                      ? "text-[var(--coral)]/70"
                      : "text-muted-foreground/70",
                  )}
                >
                  {active ? "✓ Dipilih" : "Tap pilih"}
                </p>
              </div>
            </button>
          );
        })}

        {/* Search/add button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 bg-card/20 p-4 text-center transition-all hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/5 active:scale-[0.97]"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--coral)]/70 to-[var(--orange)]/70 text-white shadow transition-transform group-hover:-translate-y-0.5 group-hover:from-[var(--coral)] group-hover:to-[var(--orange)]">
            <Search size={16} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-[12px] font-bold text-foreground/90">
            Cari mapel
          </span>
          <span className="text-[9.5px] text-muted-foreground">
            Kustom / lainnya
          </span>
        </button>
      </div>

      {/* Inline continue button */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--coral)] px-5 py-4 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] transition-all hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_24px_rgba(225,29,72,0.5)] active:scale-[0.98]"
        >
          Lanjut
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
