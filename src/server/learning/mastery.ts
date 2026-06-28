/**
 * ═══════════════════════════════════════════════════════════════
 * MASTERY SYSTEM — Continuous Running Score (0-100)
 * ═══════════════════════════════════════════════════════════════
 *
 * Mastery berubah SETIAP attempt. Bukan rolling window, tapi
 * running score yang terakumulasi dari SEMUA attempt.
 *
 * Komponen:
 * 1. Base Delta — perubahan dasar berdasarkan correct/incorrect
 * 2. Difficulty Weight — soal sulit lebih berbobot
 * 3. Confidence Factor — semakin banyak attempt, semakin stabil
 * 4. Decay — penurunan jika tidak latihan > 7 hari
 * 5. Time Factor — bonus/penalty berdasarkan waktu jawab
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface MasteryUpdateInput {
  currentMastery: number; // 0-100
  attemptCount: number; // total attempts sebelumnya
  isCorrect: boolean;
  difficultyScore: number; // 0-100
  timeSpentSeconds: number;
  avgTimeForDifficulty: number; // baseline waktu untuk difficulty ini
  daysSinceLastAttempt: number; // untuk decay
}

export interface MasteryUpdateResult {
  newMastery: number; // 0-100
  delta: number; // perubahan (+ atau -)
  components: {
    baseDelta: number;
    difficultyWeight: number;
    confidenceFactor: number;
    timeFactor: number;
    decay: number;
  };
}

export interface ConfidenceInput {
  attemptCount: number;
  daysSinceLastAttempt: number;
}

export interface DecayInput {
  currentScore: number;
  daysSinceLastAttempt: number;
  lastDecayAt?: Date | null;
}

export interface SubjectMasteryInput {
  conceptMasteries: Array<{
    score: number;
    confidence: number;
    attemptCount: number;
    lastAttemptAt?: Date | null;
  }>;
}

export interface SubjectMasteryResult {
  score: number;
  confidence: number;
  conceptsMastered: number;
  conceptsTotal: number;
  recommendedDifficulty: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Grace period sebelum decay dimulai (hari) */
const DECAY_GRACE_PERIOD = 7;

/** Decay rate per hari setelah grace period */
const DECAY_RATE_TIER_1 = 0.5; // hari 8-14
const DECAY_RATE_TIER_2 = 1.0; // hari 15-30
const DECAY_RATE_TIER_3 = 1.5; // hari 31+

/** Batas maksimum decay */
const DECAY_MAX = 20;

/** Base delta untuk jawaban benar (sebelum dikali factor) */
const BASE_DELTA_CORRECT = 15;

/** Base delta untuk jawaban salah (sebelum dikali factor) */
const BASE_DELTA_WRONG = 12;

/** Time bonus untuk jawaban cepat */
const TIME_BONUS_FAST = 1.15;

/** Time penalty untuk jawaban terlalu cepat (mungkin asal) */
const TIME_PENALTY_TOO_FAST = 0.85;

/** Threshold untuk dianggap "menguasai" */
export const MASTERY_THRESHOLDS = {
  BARU_MULAI: 0,
  BELAJAR_DASAR: 16,
  BERKEMBANG: 36,
  CUKUP_PAHAM: 56,
  PAHAM_BAIK: 76,
  MENGUASAI: 89,
} as const;

/** Label untuk UI */
export const MASTERY_LABELS: Array<{
  min: number;
  max: number;
  label: string;
  color: string;
}> = [
  { min: 0, max: 15, label: "Baru Mulai", color: "gray" },
  { min: 16, max: 35, label: "Belajar Dasar", color: "blue-light" },
  { min: 36, max: 55, label: "Berkembang", color: "blue" },
  { min: 56, max: 75, label: "Cukup Paham", color: "green-light" },
  { min: 76, max: 88, label: "Paham Baik", color: "green" },
  { min: 89, max: 100, label: "Menguasai", color: "gold" },
];

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Hitung mastery baru berdasarkan attempt.
 * Ini adalah RUNNING SCORE — berubah setiap attempt.
 */
export function computeNewMastery(
  input: MasteryUpdateInput,
): MasteryUpdateResult {
  const {
    currentMastery,
    attemptCount,
    isCorrect,
    difficultyScore,
    timeSpentSeconds,
    avgTimeForDifficulty,
    daysSinceLastAttempt,
  } = input;

  // 1. DECAY — jika > 7 hari tidak latihan
  const decay = computeDecayAmount(daysSinceLastAttempt);

  // 2. DIFFICULTY WEIGHT
  // Gap positif (soal lebih sulit dari mastery) → weight tinggi
  // Gap negatif (soal lebih mudah dari mastery) → weight rendah
  const difficultyWeight = computeDifficultyWeight(
    difficultyScore,
    currentMastery,
  );

  // 3. BASE DELTA
  let baseDelta: number;
  if (isCorrect) {
    // Benar: naik berdasarkan difficulty
    // Soal sulit benar → naik banyak, soal mudah benar → naik sedikit
    baseDelta = (difficultyScore / 100) * BASE_DELTA_CORRECT * difficultyWeight;
  } else {
    // Salah: turun berdasarkan difficulty
    // Soal mudah salah → turun banyak (harusnya bisa)
    // Soal sulit salah → turun sedikit (wajar)
    baseDelta =
      -((100 - difficultyScore) / 100) * BASE_DELTA_WRONG * difficultyWeight;
  }

  // 4. TIME FACTOR
  const timeFactor = computeTimeFactor(
    isCorrect,
    timeSpentSeconds,
    avgTimeForDifficulty,
  );

  // 5. CONFIDENCE FACTOR — semakin banyak attempt, semakin kecil perubahan
  const confidenceFactor = computeConfidenceFactor(attemptCount);

  // 6. FINAL CALCULATION
  const delta = baseDelta * timeFactor * confidenceFactor;
  const newMastery = clamp01(currentMastery + delta - decay);

  return {
    newMastery,
    delta,
    components: {
      baseDelta,
      difficultyWeight,
      confidenceFactor,
      timeFactor,
      decay,
    },
  };
}

/**
 * Hitung confidence score (0-100).
 * Semakin banyak attempt dan semakin baru, semakin tinggi confidence.
 */
export function computeConfidence(input: ConfidenceInput): number {
  const { attemptCount, daysSinceLastAttempt } = input;

  // Attempt factor: max setelah 30 attempts
  const attemptFactor = Math.min(attemptCount / 30, 1);

  // Recency factor: 1 = hari ini, 0 = 30+ hari yang lalu
  const recencyFactor = Math.max(0, 1 - daysSinceLastAttempt / 30);

  return Math.round((attemptFactor * 0.6 + recencyFactor * 0.4) * 100);
}

/**
 * Hitung decay amount berdasarkan hari tidak latihan.
 */
export function computeDecayAmount(daysSinceLastAttempt: number): number {
  if (daysSinceLastAttempt <= DECAY_GRACE_PERIOD) {
    return 0; // grace period
  }

  const decayDays = daysSinceLastAttempt - DECAY_GRACE_PERIOD;
  let decay = 0;

  if (decayDays <= 7) {
    // Tier 1: hari 8-14
    decay = decayDays * DECAY_RATE_TIER_1;
  } else if (decayDays <= 23) {
    // Tier 2: hari 15-30
    decay = 7 * DECAY_RATE_TIER_1 + (decayDays - 7) * DECAY_RATE_TIER_2;
  } else {
    // Tier 3: hari 31+
    decay =
      7 * DECAY_RATE_TIER_1 +
      16 * DECAY_RATE_TIER_2 +
      (decayDays - 23) * DECAY_RATE_TIER_3;
  }

  return Math.min(decay, DECAY_MAX);
}

/**
 * Hitung difficulty weight berdasarkan gap antara difficulty dan mastery.
 */
export function computeDifficultyWeight(
  difficultyScore: number,
  currentMastery: number,
): number {
  const difficultyGap = difficultyScore - currentMastery;
  // Clamp antara 0.1 dan 1.0
  return clamp(0.3 + difficultyGap / 200, 0.1, 1.0);
}

/**
 * Hitung time factor untuk bonus/penalty.
 */
export function computeTimeFactor(
  isCorrect: boolean,
  timeSpentSeconds: number,
  avgTimeForDifficulty: number,
): number {
  if (avgTimeForDifficulty <= 0) return 1.0; // no baseline

  const timeRatio = timeSpentSeconds / avgTimeForDifficulty;

  if (isCorrect && timeRatio < 0.75) {
    return TIME_BONUS_FAST; // bonus untuk jawaban cepat dan benar
  }

  if (!isCorrect && timeRatio < 0.5) {
    return TIME_PENALTY_TOO_FAST; // penalty untuk jawaban terlalu cepat (mungkin asal)
  }

  return 1.0;
}

/**
 * Hitung confidence factor (stabilizer).
 * Semakin banyak attempt, semakin kecil perubahan per attempt.
 */
export function computeConfidenceFactor(attemptCount: number): number {
  // Logarithmic decay: lebih lambat dari sebelumnya
  return 1 / (1 + Math.log2(Math.sqrt(attemptCount + 1)));
}

/**
 * Agregasi mastery per konsep ke level subject.
 */
export function aggregateSubjectMastery(
  input: SubjectMasteryInput,
): SubjectMasteryResult {
  const { conceptMasteries } = input;

  if (conceptMasteries.length === 0) {
    return {
      score: 0,
      confidence: 0,
      conceptsMastered: 0,
      conceptsTotal: 0,
      recommendedDifficulty: 50,
    };
  }

  // Weighted average: confidence sebagai weight
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let conceptsMastered = 0;

  for (const cm of conceptMasteries) {
    // Weight = confidence, minimal 0.1 agar tetap ada bobot
    const weight = Math.max(cm.confidence / 100, 0.1);
    totalWeightedScore += cm.score * weight;
    totalWeight += weight;

    if (cm.score >= MASTERY_THRESHOLDS.MENGUASAI) {
      conceptsMastered++;
    }
  }

  const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Confidence rata-rata
  const avgConfidence =
    conceptMasteries.reduce((sum, cm) => sum + cm.confidence, 0) /
    conceptMasteries.length;

  // Recommended difficulty: sedikit lebih sulit dari mastery
  const recommendedDifficulty = Math.min(score * 1.1, 100);

  return {
    score: Math.round(score * 100) / 100,
    confidence: Math.round(avgConfidence),
    conceptsMastered,
    conceptsTotal: conceptMasteries.length,
    recommendedDifficulty: Math.round(recommendedDifficulty),
  };
}

/**
 * Dapatkan label mastery untuk UI.
 */
export function getMasteryLabel(score: number): {
  label: string;
  color: string;
} {
  for (const threshold of MASTERY_LABELS) {
    if (score >= threshold.min && score <= threshold.max) {
      return { label: threshold.label, color: threshold.color };
    }
  }
  return { label: "Baru Mulai", color: "gray" };
}

/**
 * Hitung rata-rata waktu untuk difficulty tertentu.
 * Digunakan sebagai baseline untuk time factor.
 */
export function estimateAvgTimeForDifficulty(difficultyScore: number): number {
  // Base time: 30 detik untuk difficulty 0, 120 detik untuk difficulty 100
  return 30 + (difficultyScore / 100) * 90;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Hitung hari antara dua tanggal.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ═══════════════════════════════════════════════════════════════
// CONFIG EXPORT (untuk testing dan debugging)
// ═══════════════════════════════════════════════════════════════

export const MASTERY_CONFIG = {
  DECAY_GRACE_PERIOD,
  DECAY_RATE_TIER_1,
  DECAY_RATE_TIER_2,
  DECAY_RATE_TIER_3,
  DECAY_MAX,
  BASE_DELTA_CORRECT,
  BASE_DELTA_WRONG,
  TIME_BONUS_FAST,
  TIME_PENALTY_TOO_FAST,
  MASTERY_THRESHOLDS,
} as const;
