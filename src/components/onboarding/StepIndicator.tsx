import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  key: string;
  label: string;
};

export function StepIndicator({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                isCurrent ? "scale-105" : "",
              )}
            >
              {/* Step number/indicator */}
              <span
                className={cn(
                  "relative grid size-7 place-items-center rounded-full text-[11px] font-bold transition-all duration-300",
                  isPast
                    ? "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
                    : isCurrent
                      ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.35)] ring-4 ring-[var(--coral)]/20"
                      : "bg-muted/60 text-muted-foreground/50",
                )}
              >
                {isPast ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>

              {/* Label - hidden on mobile for space */}
              <span
                className={cn(
                  "hidden text-[11px] font-semibold transition-colors sm:inline",
                  isCurrent
                    ? "text-[var(--coral)]"
                    : isPast
                      ? "text-[var(--teal)]/80"
                      : "text-muted-foreground/50",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
