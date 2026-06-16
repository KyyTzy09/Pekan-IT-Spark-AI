"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Sparkles, X } from "lucide-react";

export type BadgeUnlock = {
  badgeId: string;
  badgeName: string;
  badgeDescription: string | null;
  xpReward: number;
  category: string | null;
};

type BadgeUnlockContextType = {
  showBadges: (badges: BadgeUnlock[]) => void;
};

const BadgeUnlockContext = React.createContext<BadgeUnlockContextType | null>(null);

export function useBadgeCelebration() {
  const context = React.useContext(BadgeUnlockContext);
  if (!context) {
    throw new Error("useBadgeCelebration must be used within a BadgeUnlockProvider");
  }
  return context;
}

export function BadgeUnlockProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<BadgeUnlock[]>([]);
  const [current, setCurrent] = React.useState<BadgeUnlock | null>(null);

  const showBadges = React.useCallback((badges: BadgeUnlock[]) => {
    if (!badges || badges.length === 0) return;
    setQueue((prev) => [...prev, ...badges]);
  }, []);

  React.useEffect(() => {
    if (!current && queue.length > 0) {
      const next = queue[0];
      setCurrent(next);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, current]);

  React.useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 3500); // 3.5 seconds celebration

      return () => clearTimeout(timer);
    }
  }, [current]);

  return (
    <BadgeUnlockContext.Provider value={{ showBadges }}>
      {children}

      <AnimatePresence>
        {current && (
          <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/25 backdrop-blur-[2px]"
            />

            {/* Float Sparkles animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: "50vw",
                    y: "50vh",
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.3, 1.2, 0.8, 0],
                    x: `${Math.random() * 80 + 10}vw`,
                    y: `${Math.random() * 80 + 10}vh`,
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeOut",
                  }}
                  className="absolute text-amber-400"
                >
                  <Sparkles size={Math.random() * 16 + 12} fill="currentColor" />
                </motion.div>
              ))}
            </div>

            {/* Celebration Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-300/40 bg-card/90 p-6 shadow-2xl backdrop-blur-xl dark:border-amber-500/10 text-center"
            >
              {/* Radial gradient background */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-12 -top-12 size-36 rounded-full bg-amber-500/10 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -bottom-12 size-36 rounded-full bg-teal-500/10 blur-2xl"
              />

              <button
                type="button"
                onClick={() => setCurrent(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>

              <div className="relative flex flex-col items-center">
                {/* Rotating icon badge container */}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20"
                >
                  <Award size={32} />
                  <Sparkles size={14} className="absolute -right-1.5 -top-1.5 text-amber-300 animate-pulse" />
                </motion.div>

                <span className="mt-4 rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Badge Terbuka!
                </span>

                <h3 className="mt-2 font-heading text-lg font-bold text-foreground">
                  {current.badgeName}
                </h3>

                {current.badgeDescription && (
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed px-2">
                    {current.badgeDescription}
                  </p>
                )}

                {/* Spark Greeting Message */}
                <div className="mt-4 w-full rounded-2xl bg-muted/40 p-3 border border-border/20 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--teal)] flex items-center gap-1">
                    🦊 Pesan dari Spark
                  </p>
                  <p className="mt-1 text-[11.5px] text-foreground/80 leading-normal italic">
                    "Keren banget! Kamu baru aja dapet badge baru. Terus semangat belajarnya ya!"
                  </p>
                </div>

                {/* XP Reward Badge */}
                {current.xpReward > 0 && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>+{current.xpReward} XP</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </BadgeUnlockContext.Provider>
  );
}
