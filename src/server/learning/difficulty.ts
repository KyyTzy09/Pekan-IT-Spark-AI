import type { Difficulty } from "../../../generated/prisma/client";

/**
 * ═══════════════════════════════════════════════════════════════
 * DIFFICULTY SYSTEM — Continuous Score (0-100)
 * ═══════════════════════════════════════════════════════════════
 *
 * Mengkonversi antara enum Difficulty (lama) dan score 0-100 (baru).
 * Juga menyediakan fungsi untuk memilih target difficulty berdasarkan mastery.
 */

// ═══════════════════════════════════════════════════════════════
// MAPPING
// ═══════════════════════════════════════════════════════════════

/** Mapping dari enum Difficulty ke score 0-100 */
const DIFFICULTY_TO_SCORE: Record<Difficulty, number> = {
  EASY: 20,
  MEDIUM: 45,
  HARD: 70,
  ADVANCED: 90,
};

/** Mapping dari score 0-100 ke enum Difficulty */
function scoreToDifficultyEnum(score: number): Difficulty {
  if (score <= 30) return "EASY";
  if (score <= 55) return "MEDIUM";
  if (score <= 80) return "HARD";
  return "ADVANCED";
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Konversi enum Difficulty ke score 0-100.
 */
export function difficultyToScore(difficulty: Difficulty): number {
  return DIFFICULTY_TO_SCORE[difficulty] ?? 50;
}

/**
 * Konversi score 0-100 ke enum Difficulty.
 * Digunakan untuk backward compatibility.
 */
export function scoreToDifficulty(score: number): Difficulty {
  return scoreToDifficultyEnum(score);
}

/**
 * Pilih target difficulty berdasarkan mastery siswa.
 *
 * Strategi:
 * - Mastery rendah → difficulty lebih mudah (sedikit di atas mastery)
 * - Mastery tinggi → difficulty lebih sulit (sedikit di atas mastery)
 * - Selalu tantang siswa sedikit di atas level mereka
 */
export function selectTargetDifficulty(
  masteryScore: number,
  confidence: number,
): number {
  // Base target: sedikit di atas mastery
  const baseOffset = 10; // 10 poin di atas mastery
  let target = masteryScore + baseOffset;

  // Jika confidence rendah, kurangi target (lebih konservatif)
  if (confidence < 30) {
    target -= 10;
  } else if (confidence < 60) {
    target -= 5;
  }

  // Clamp 0-100
  return Math.max(10, Math.min(95, target));
}

/**
 * Pilih difficulty untuk challenge berdasarkan mastery subject.
 * Challenge harus lebih sulit dari latihan biasa.
 */
export function selectChallengeDifficulty(
  subjectMastery: number,
  confidence: number,
): number {
  // Challenge: 15% lebih sulit dari mastery
  let target = subjectMastery * 1.15;

  // Jika confidence rendah, kurangi target
  if (confidence < 30) {
    target -= 10;
  } else if (confidence < 60) {
    target -= 5;
  }

  // Clamp 20-100 (challenge tidak boleh terlalu mudah)
  return Math.max(20, Math.min(100, target));
}

/**
 * Cek apakah soal cocok untuk level siswa.
 * Digunakan untuk filter soal yang ada.
 */
export function isQuestionSuitable(
  questionDifficulty: number,
  masteryScore: number,
  tolerance: number = 20,
): boolean {
  const gap = Math.abs(questionDifficulty - masteryScore);
  return gap <= tolerance;
}

/**
 * Hitung rata-rata difficulty dari array soal.
 */
export function averageDifficulty(difficulties: number[]): number {
  if (difficulties.length === 0) return 50;
  return difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
}

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY LABELS (untuk UI)
// ═══════════════════════════════════════════════════════════════

export const DIFFICULTY_LABELS: Array<{
  min: number;
  max: number;
  label: string;
  color: string;
}> = [
  { min: 0, max: 20, label: "Sangat Mudah", color: "green" },
  { min: 21, max: 40, label: "Mudah", color: "green-light" },
  { min: 41, max: 60, label: "Sedang", color: "yellow" },
  { min: 61, max: 80, label: "Sulit", color: "orange" },
  { min: 81, max: 100, label: "Sangat Sulit", color: "red" },
];

/**
 * Dapatkan label difficulty untuk UI.
 */
export function getDifficultyLabel(score: number): {
  label: string;
  color: string;
} {
  for (const threshold of DIFFICULTY_LABELS) {
    if (score >= threshold.min && score <= threshold.max) {
      return { label: threshold.label, color: threshold.color };
    }
  }
  return { label: "Sedang", color: "yellow" };
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Konversi mastery lama (0-1) ke baru (0-100).
 * Digunakan saat migration.
 */
export function legacyMasteryToNew(oldMastery: number): number {
  return Math.round(oldMastery * 100);
}

/**
 * Konversi mastery baru (0-100) ke lama (0-1).
 * Digunakan untuk backward compatibility jika diperlukan.
 */
export function newMasteryToLegacy(newMastery: number): number {
  return newMastery / 100;
}
