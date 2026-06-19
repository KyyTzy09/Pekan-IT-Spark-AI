import { ArrowRight, Check, Search } from "lucide-react";
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
  return (
    <div className="space-y-4">
      {/* Selected count indicator */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--teal)]/25 bg-[var(--teal)]/8 px-4 py-2.5 backdrop-blur-sm">
          <span className="grid size-6 place-items-center rounded-full bg-[var(--teal)] text-white text-[11px] font-bold">
            {selected.length}
          </span>
          <span className="text-[12.5px] font-semibold text-[var(--teal)]">
            mapel dipilih
          </span>
        </div>
      )}

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
                "group/sub relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all active:scale-[0.97]",
                active
                  ? "border-[var(--coral)]/50 bg-gradient-to-br from-[var(--coral)]/10 to-[var(--orange)]/5 shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                  : "border-border/40 bg-card/40 hover:border-border/70 hover:bg-card/60",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/sub:-translate-y-0.5",
                    active && "ring-2 ring-white/30 scale-105",
                  )}
                  style={{
                    background: s.color
                      ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                      : "linear-gradient(135deg, var(--coral), var(--orange))",
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
              <span
                className={cn(
                  "font-heading text-[14px] font-bold transition-colors",
                  active ? "text-[var(--coral)]" : "text-foreground",
                )}
              >
                {s.name}
              </span>
              <span
                className={cn(
                  "text-[10.5px] font-semibold transition-colors",
                  active ? "text-[var(--coral)]/70" : "text-muted-foreground",
                )}
              >
                {active ? "✓ Dipilih" : "Tap buat pilih"}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenSearch}
          className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 bg-card/20 p-4 text-center transition-all hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/5"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.2)] transition-transform group-hover:-translate-y-0.5">
            <Search size={16} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-[13px] font-bold text-foreground">
            Cari mapel lain
          </span>
          <span className="text-[10px] text-muted-foreground">
            Atau tambah mapel kustom
          </span>
        </button>
      </div>

      {/* Inline continue button */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--coral)] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] transition-all hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_24px_rgba(225,29,72,0.5)] active:scale-[0.98]"
        >
          Lanjut dengan {selected.length} mapel
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
