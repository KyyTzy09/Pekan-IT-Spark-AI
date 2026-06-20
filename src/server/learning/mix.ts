import "server-only";

export type MixQuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type MixBloomTaxonomy =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE";

export type MixInput = {
  avgMastery: number;
  growthTrend: number;
  hasAttempts: boolean;
};

export type MixResult = {
  questions: number;
  materials: number;
  reflections: number;
  questionDifficulty: MixQuestionDifficulty;
  bloomTaxonomy: MixBloomTaxonomy;
};

type Strength = "weak" | "balanced" | "strong";
type Trend = "stagnant" | "growing";

const WEAK_STAGNANT: MixResult = {
  questions: 2,
  materials: 2,
  reflections: 1,
  questionDifficulty: "EASY",
  bloomTaxonomy: "UNDERSTAND",
};

const WEAK_GROWING: MixResult = {
  questions: 3,
  materials: 1,
  reflections: 1,
  questionDifficulty: "MEDIUM",
  bloomTaxonomy: "UNDERSTAND",
};

const BALANCED: MixResult = {
  questions: 3,
  materials: 1,
  reflections: 1,
  questionDifficulty: "MEDIUM",
  bloomTaxonomy: "APPLY",
};

const STRONG_STAGNANT: MixResult = {
  questions: 3,
  materials: 1,
  reflections: 1,
  questionDifficulty: "HARD",
  bloomTaxonomy: "ANALYZE",
};

const STRONG_GROWING: MixResult = {
  questions: 4,
  materials: 1,
  reflections: 0,
  questionDifficulty: "HARD",
  bloomTaxonomy: "ANALYZE",
};

function classifyStrength(avgMastery: number): Strength {
  if (avgMastery < 0.4) return "weak";
  if (avgMastery <= 0.7) return "balanced";
  return "strong";
}

function classifyTrend(growthTrend: number): Trend {
  return growthTrend >= 0.05 ? "growing" : "stagnant";
}

export function computeMixForSubject(input: MixInput): MixResult {
  if (!input.hasAttempts) {
    return WEAK_STAGNANT;
  }

  const strength = classifyStrength(input.avgMastery);
  const trend = classifyTrend(input.growthTrend);

  if (strength === "weak") {
    return trend === "growing" ? WEAK_GROWING : WEAK_STAGNANT;
  }
  if (strength === "balanced") {
    return BALANCED;
  }
  return trend === "growing" ? STRONG_GROWING : STRONG_STAGNANT;
}
