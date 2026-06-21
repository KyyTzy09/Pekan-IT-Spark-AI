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
    <div className="space-y-6">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="rounded-xl border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-bold text-[var(--teal)]">
              {selected.length} mapel dipilih
            </p>
            <p className="text-[11px] text-muted-foreground">Tap untuk hapus</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className="flex items-center gap-2 rounded-full bg-[var(--teal)]/20 px-3.5 py-2 text-[12px] font-bold text-[var(--teal)] transition-all hover:bg-[var(--teal)]/30 active:scale-95"
              >
                <span className="text-[14px]">{s.icon ?? "📚"}</span>
                {s.name}
                <X size={14} strokeWidth={2.5} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 active:scale-[0.97]",
                active
                  ? "border-[var(--coral)] bg-gradient-to-br from-[var(--coral)]/8 to-[var(--orange)]/5 shadow-[0_8px_24px_rgba(225,29,72,0.12)] ring-4 ring-[var(--coral)]/10"
                  : "border-border/60 bg-card/80 hover:border-border hover:bg-card",
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-lg text-white shadow transition-all",
                    active
                      ? "ring-2 ring-white/30 shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
                      : "",
                  )}
                  style={{
                    background: active
                      ? `linear-gradient(135deg, var(--coral), oklch(0.65 0.15 60))`
                      : s.color
                        ? `linear-gradient(135deg, ${s.color}, oklch(0.6 0.12 60))`
                        : "linear-gradient(135deg, var(--coral)/70, var(--orange)/70)",
                  }}
                >
                  <span className="text-[22px]">{s.icon ?? "📚"}</span>
                </span>
                {active && (
                  <span className="grid size-7 place-items-center rounded-full bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]">
                    <Check size={15} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "font-heading text-[14px] font-bold transition-colors",
                    active ? "text-[var(--coral)]" : "text-foreground",
                  )}
                >
                  {s.name}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px] font-semibold transition-colors",
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
          className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-4 text-center transition-all hover:border-[var(--coral)]/50 hover:bg-[var(--coral)]/5 active:scale-[0.97]"
        >
          <span className="grid size-11 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)]/80 to-[var(--orange)]/80 text-white shadow transition-transform group-hover:scale-110">
            <Search size={18} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-[12px] font-bold text-foreground">
            Cari mapel
          </span>
          <span className="text-[10px] text-muted-foreground">
            Kustom / lainnya
          </span>
        </button>
      </div>

      {/* Continue button */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] px-6 py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(225,29,72,0.4)] active:scale-[0.98]"
        >
          Lanjut
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
