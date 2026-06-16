/**
 * Gamification — pure functions for XP/level/streak logic.
 *
 * Leveling model:
 * - Levels 1–50 use the `Level` table for naming (admin-editable named tiers).
 * - Level 51+ uses a pure formula (`xpForFormulaLevel`), tier name "Legenda".
 * - The transition point matches: L50 in the table = 1,225,000 XP = formula L50.
 * - Beyond L50 there is NO cap — the level number keeps growing.
 */

import type { Level } from "../../generated/prisma/client";

export type LevelInfo = {
  level: number;
  name: string;
  currentMinXp: number;
  nextMinXp: number | null;
  progress: number; // 0-100, rounded
  xpToNext: number | null;
};

/**
 * XP threshold for entering level `n` using the unbounded formula.
 *   n=1   → 0
 *   n=51  → 1,275,000
 *   n=100 → 4,950,000
 *   n=500 → 124,750,000
 *   n=1000 → 499,500,000
 *
 * The factor 500 is chosen so that formula L50 == table L50 = 1,225,000 XP,
 * keeping continuity with seeded Level data and preventing XP regression.
 */
export function xpForFormulaLevel(n: number): number {
  if (n <= 1) return 0;
  return 500 * n * (n - 1);
}

/**
 * Convert total XP to level info. Unbounded.
 * - For XP < max(table.minXp): uses the Level table (1-50)
 * - For XP >= max(table.minXp): uses formula; name becomes "Legenda" (unbounded tier)
 */
export function levelFromXp(
  totalXp: number,
  tableLevels: ReadonlyArray<Pick<Level, "level" | "name" | "minXp">>,
): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp));

  if (tableLevels.length === 0) {
    return computeFromFormula(safeXp, 1);
  }

  const sorted = [...tableLevels].sort((a, b) => a.level - b.level);
  const maxTable = sorted[sorted.length - 1];

  if (safeXp >= maxTable.minXp) {
    return computeFromFormula(safeXp, maxTable.level, maxTable.name);
  }

  // Find current level from table (largest l where safeXp >= l.minXp)
  let current = sorted[0];
  for (const l of sorted) {
    if (safeXp >= l.minXp) {
      current = l;
    } else {
      break;
    }
  }

  const next = sorted.find((l) => l.level === current.level + 1);
  const currentMinXp = current.minXp;
  const nextMinXp = next?.minXp ?? null;
  const span = nextMinXp !== null ? Math.max(1, nextMinXp - currentMinXp) : 1;
  const progress =
    nextMinXp !== null
      ? Math.min(100, Math.max(0, ((safeXp - currentMinXp) / span) * 100))
      : 100;
  const xpToNext = nextMinXp !== null ? Math.max(0, nextMinXp - safeXp) : null;

  return {
    level: current.level,
    name: current.name,
    currentMinXp,
    nextMinXp,
    progress: Math.round(progress),
    xpToNext,
  };
}

function computeFromFormula(
  totalXp: number,
  baseLevel: number,
  fallbackName = "Legenda",
): LevelInfo {
  // Solve 500 * n * (n-1) = totalXp
  //   n^2 - n - totalXp/500 = 0
  //   n = (1 + sqrt(1 + 4*totalXp/500)) / 2
  const n = Math.max(
    baseLevel,
    Math.ceil((1 + Math.sqrt(1 + (4 * totalXp) / 500)) / 2),
  );
  const currentMinXp = xpForFormulaLevel(n);
  const nextMinXp = xpForFormulaLevel(n + 1);
  const span = Math.max(1, nextMinXp - currentMinXp);
  const progress = Math.min(
    100,
    Math.max(0, ((totalXp - currentMinXp) / span) * 100),
  );
  const xpToNext = Math.max(0, nextMinXp - totalXp);

  return {
    level: n,
    name: n > 50 ? "Legenda" : fallbackName,
    currentMinXp,
    nextMinXp,
    progress: Math.round(progress),
    xpToNext,
  };
}

/**
 * XP rewards per source. Keep in sync with §7.1 + §6.6.9.
 * Centralized so other modules don't hardcode numbers.
 */
export const XP_REWARDS = {
  ANSWER_CORRECT: 10,
  CHAT_MESSAGE: 2, // per assistant turn (small)
  CHAT_SESSION: 5, // end of session bonus
  STREAK_DAILY: 20,
  CONCEPT_MASTERED: 50,
  DAILY_QUEST: 30,
  WEEKLY_CHALLENGE: 100,
  BADGE_UNLOCK: 25,
} as const;

export type XpRewardKey = keyof typeof XP_REWARDS;

/**
 * Streak milestones and their celebratory message.
 * Brief, positive — no shame per 7.2 anti-patterns.
 */
export const STREAK_MILESTONES: ReadonlyArray<{
  days: number;
  message: string;
}> = [
  {
    days: 3,
    message: "3 hari berturut-turut! Konsistensi kecil, dampak besar. ✨",
  },
  { days: 7, message: "Seminggu penuh! Streak master mode: ON. 🔥" },
  { days: 14, message: "2 minggu! Kamu udah mulai kebiasaan yang keren. 💪" },
  { days: 30, message: "30 hari! Konsistensi adalah superpower. 🌟" },
  { days: 100, message: "100 hari! Legend status achieved. 🏆" },
];

/**
 * Positive message when streak breaks. No shame, no blame.
 * Per 7.2 anti-pattern: "Gapapa, yuk mulai lembaran baru!"
 */
export function getStreakBrokenMessage(prevStreak: number): string {
  if (prevStreak >= 30) {
    return `${prevStreak} hari streak-nya berakhir. Itu rekor yang luar biasa — yuk mulai lembaran baru! 🌱`;
  }
  if (prevStreak >= 7) {
    return `${prevStreak} hari yang keren! Yuk mulai lembaran baru hari ini. 🌱`;
  }
  return "Gapapa, yuk mulai lembaran baru! 🌱";
}
