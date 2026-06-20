import { Check, Star } from "lucide-react";
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
    <div className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/60 px-5 py-4 backdrop-blur-sm">
      {/* Vertical timeline */}
      <div className="flex flex-col items-center">
        {steps.map((_, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <div key={`dot-${i}`} className="relative flex items-center">
              <span
                className={cn(
                  "relative z-10 grid size-7 place-items-center rounded-full text-[11px] font-bold transition-all duration-300",
                  isPast
                    ? "bg-[var(--teal)] text-white shadow-[0_0_12px_rgba(20,184,166,0.4)]"
                    : isCurrent
                      ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_0_16px_rgba(225,29,72,0.5)] ring-2 ring-[var(--coral)]/40"
                      : "bg-muted/60 text-muted-foreground/60",
                )}
              >
                {isPast ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div className="absolute left-1/2 top-7 h-8 w-[2px] -translate-x-1/2 bg-muted/40">
                  <div
                    className={cn(
                      "h-full w-full rounded-full transition-all duration-500",
                      i < current ? "bg-[var(--teal)]" : "bg-transparent",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex flex-col justify-between py-0.5">
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
              <span
                className={cn(
                  "text-[12px] font-semibold transition-colors",
                  isCurrent
                    ? "text-[var(--coral)]"
                    : isPast
                      ? "text-[var(--teal)]/80"
                      : "text-muted-foreground/50",
                )}
              >
                {s.label}
              </span>
              {isPast && (
                <Star
                  size={10}
                  className="text-[var(--teal)] fill-[var(--teal)]"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
