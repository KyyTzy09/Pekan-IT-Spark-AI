"use client";

import { cn } from "@/lib/utils";

const SEGMENT_LABELS = ["", "Lemah", "Cukup", "Bagus", "Kuat"] as const;

function scorePassword(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (pwd.length === 0) return 0;
  if (pwd.length < 8) return 1;
  let score = 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const SEGMENT_COLOR: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40",
  1: "bg-rose-500",
  2: "bg-orange-500",
  3: "bg-amber-500",
  4: "bg-[var(--teal)]",
};

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);

  if (score === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i <= score ? SEGMENT_COLOR[score] : "bg-muted/40",
            )}
          />
        ))}
      </div>
      <p
        className="text-[10.5px] font-semibold text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Kekuatan: {SEGMENT_LABELS[score]}
      </p>
    </div>
  );
}
