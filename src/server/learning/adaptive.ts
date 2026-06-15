import "server-only";

import type {
  ConceptStatus,
  Difficulty,
} from "../../../generated/prisma/client";

export type AdaptiveDifficulty = Difficulty;

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD", "ADVANCED"];

const DIFFICULTY_VALUE: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  ADVANCED: 4,
};

export interface AttemptRecord {
  isCorrect: boolean;
  difficulty: Difficulty;
  timeSpent?: number | null;
  conceptId: string;
  createdAt: Date;
}

export interface ConceptMasterySnapshot {
  conceptId: string;
  status: ConceptStatus;
  masteryScore: number;
}

const ROLLING_WINDOW = 5;
const PROMOTE_THRESHOLD = 0.7;
const DEMOTE_STREAK = 3;
const MASTERY_THRESHOLD = 0.8;
const STRUGGLING_THRESHOLD = 0.4;

export function rollingAccuracy(attempts: AttemptRecord[]): number {
  const recent = attempts.slice(-ROLLING_WINDOW);
  if (recent.length === 0) return 0;
  const correct = recent.filter((a) => a.isCorrect).length;
  return correct / recent.length;
}

export function selectNextDifficulty(
  attempts: AttemptRecord[],
  currentBaseline: Difficulty,
): AdaptiveDifficulty {
  if (attempts.length < 2) return currentBaseline;

  const wrongStreak = countTrailingWrong(attempts);
  if (wrongStreak >= DEMOTE_STREAK) {
    return stepDown(currentBaseline);
  }

  const accuracy = rollingAccuracy(attempts);
  if (accuracy >= PROMOTE_THRESHOLD && attempts.length >= ROLLING_WINDOW) {
    return stepUp(currentBaseline);
  }
  if (accuracy < 0.4) {
    return stepDown(currentBaseline);
  }
  return currentBaseline;
}

export function computeMasteryUpdate(
  prevScore: number,
  newAttempt: AttemptRecord,
): number {
  const target = newAttempt.isCorrect ? 1 : 0;
  const learningRate = 0.2;
  const updated = prevScore + learningRate * (target - prevScore);
  return clamp01(updated);
}

export function deriveConceptStatus(masteryScore: number): ConceptStatus {
  if (masteryScore >= MASTERY_THRESHOLD) return "MASTERED";
  if (masteryScore < STRUGGLING_THRESHOLD && masteryScore > 0)
    return "STRUGGLING";
  if (masteryScore > 0) return "LEARNING";
  return "NOT_STARTED";
}

export interface PrerequisiteCheck {
  satisfied: boolean;
  weakPrereqs: Array<{ conceptId: string; score: number; name?: string }>;
  threshold: number;
}

export function checkPrerequisites(
  prerequisites: Array<{
    prerequisiteId: string;
    minMasteryScore: number | null;
  }>,
  masteryByConcept: Map<string, number>,
  conceptNames?: Map<string, string>,
  threshold = 0.6,
): PrerequisiteCheck {
  const weak: PrerequisiteCheck["weakPrereqs"] = [];
  for (const p of prerequisites) {
    const score = masteryByConcept.get(p.prerequisiteId) ?? 0;
    const required = p.minMasteryScore ?? threshold;
    if (score < required) {
      weak.push({
        conceptId: p.prerequisiteId,
        score,
        name: conceptNames?.get(p.prerequisiteId),
      });
    }
  }
  return {
    satisfied: weak.length === 0,
    weakPrereqs: weak,
    threshold,
  };
}

export interface AdaptiveSessionStats {
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  currentDifficulty: AdaptiveDifficulty;
  recommendedDifficulty: AdaptiveDifficulty;
  strugglingConcepts: string[];
}

export function summarizeSession(
  attempts: AttemptRecord[],
  currentDifficulty: Difficulty,
  masteryByConcept: Map<string, ConceptMasterySnapshot>,
): AdaptiveSessionStats {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const accuracy = total === 0 ? 0 : correct / total;
  const currentStreak = countTrailingCorrect(attempts);
  const longestStreak = longestCorrectStreak(attempts);
  const recommended = selectNextDifficulty(attempts, currentDifficulty);
  const struggling: string[] = [];
  for (const [id, m] of masteryByConcept) {
    if (m.status === "STRUGGLING") struggling.push(id);
  }
  return {
    totalAttempts: total,
    correctCount: correct,
    accuracy,
    currentStreak,
    longestStreak,
    currentDifficulty,
    recommendedDifficulty: recommended,
    strugglingConcepts: struggling,
  };
}

function countTrailingWrong(attempts: AttemptRecord[]): number {
  let n = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].isCorrect) break;
    n++;
  }
  return n;
}

function countTrailingCorrect(attempts: AttemptRecord[]): number {
  let n = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (!attempts[i].isCorrect) break;
    n++;
  }
  return n;
}

function longestCorrectStreak(attempts: AttemptRecord[]): number {
  let best = 0;
  let cur = 0;
  for (const a of attempts) {
    if (a.isCorrect) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function stepUp(d: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
}

function stepDown(d: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export const ADAPTIVE_CONFIG = {
  ROLLING_WINDOW,
  PROMOTE_THRESHOLD,
  DEMOTE_STREAK,
  MASTERY_THRESHOLD,
  STRUGGLING_THRESHOLD,
  DIFFICULTY_VALUE,
} as const;
