"use client";

import { Flame, X } from "lucide-react";
import * as React from "react";

const DISMISS_KEY = "spark-auth-streak-dismissed";

export function AuthStreakTeaser() {
  const [dismissed, setDismissed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage unavailable, ignore
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!hydrated || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border-l-4 border-[var(--coral)] bg-[var(--coral)]/5 px-4 py-3 animate-fade-in"
    >
      <Flame
        size={18}
        strokeWidth={2.5}
        className="mt-0.5 shrink-0 text-[var(--coral)]"
        fill="currentColor"
      />
      <div className="flex-1 text-[12.5px] leading-relaxed">
        <p className="font-bold text-foreground">Streak-mu masih nyala!</p>
        <p className="text-muted-foreground">Login dulu biar nggak putus.</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Sembunyikan pesan"
        className="grid size-6 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground active:scale-90"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
