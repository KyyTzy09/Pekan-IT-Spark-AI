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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-muted-foreground">
          Step {current + 1} / {steps.length}
        </span>
        <span className="text-[var(--coral)]">
          {Math.round(((current + 1) / steps.length) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((_, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <div
              key={`seg-${i}`}
              className={cn(
                "h-1.5 flex-1 overflow-hidden rounded-full",
                isPast
                  ? "bg-[var(--teal)]"
                  : isCurrent
                    ? "bg-muted"
                    : "bg-muted/40",
              )}
            >
              {i <= current && (
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isPast
                      ? "w-full bg-[var(--teal)]"
                      : isCurrent
                        ? "w-full bg-gradient-to-r from-[var(--coral)] to-[var(--orange)]"
                        : "w-0",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="hidden gap-1.5 sm:flex sm:items-center sm:justify-between">
        {steps.map((s, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <span
              key={s.key}
              className={cn(
                "flex items-center gap-1.5 text-[10.5px] font-semibold transition-colors",
                isCurrent
                  ? "text-[var(--coral)]"
                  : isPast
                    ? "text-[var(--teal)]"
                    : "text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[9.5px] font-bold",
                  isCurrent
                    ? "bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]"
                    : isPast
                      ? "bg-[var(--teal)] text-white"
                      : "bg-muted text-muted-foreground/60",
                )}
              >
                {isPast ? <Check size={9} strokeWidth={3} /> : i + 1}
              </span>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
