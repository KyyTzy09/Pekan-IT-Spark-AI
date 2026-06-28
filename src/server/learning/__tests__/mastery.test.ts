import { describe, expect, it } from "vitest";
import {
  computeNewMastery,
  computeConfidence,
  computeDecayAmount,
  computeDifficultyWeight,
  computeTimeFactor,
  computeConfidenceFactor,
  aggregateSubjectMastery,
  getMasteryLabel,
  MASTERY_CONFIG,
} from "../mastery.js";
import {
  difficultyToScore,
  scoreToDifficulty,
  selectTargetDifficulty,
  isQuestionSuitable,
  legacyMasteryToNew,
} from "../difficulty.js";

describe("Mastery System", () => {
  // ═══════════════════════════════════════════════════════════════
  // computeNewMastery
  // ═══════════════════════════════════════════════════════════════

  describe("computeNewMastery", () => {
    it("increases mastery on correct answer", () => {
      const result = computeNewMastery({
        currentMastery: 0,
        attemptCount: 0,
        isCorrect: true,
        difficultyScore: 50,
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      expect(result.newMastery).toBeGreaterThan(0);
      expect(result.delta).toBeGreaterThan(0);
    });

    it("decreases mastery on incorrect answer", () => {
      const result = computeNewMastery({
        currentMastery: 50,
        attemptCount: 10,
        isCorrect: false,
        difficultyScore: 30,
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      expect(result.newMastery).toBeLessThan(50);
      expect(result.delta).toBeLessThan(0);
    });

    it("5 easy correct answers give modest increase (not 67 points)", () => {
      let mastery = 0;
      for (let i = 0; i < 5; i++) {
        const result = computeNewMastery({
          currentMastery: mastery,
          attemptCount: i,
          isCorrect: true,
          difficultyScore: 20, // EASY
          timeSpentSeconds: 60,
          avgTimeForDifficulty: 60,
          daysSinceLastAttempt: 0,
        });
        mastery = result.newMastery;
      }
      // Should be around 10-20, not 67
      expect(mastery).toBeGreaterThan(3);
      expect(mastery).toBeLessThan(30);
    });

    it("5 hard correct answers give larger increase", () => {
      let mastery = 0;
      for (let i = 0; i < 5; i++) {
        const result = computeNewMastery({
          currentMastery: mastery,
          attemptCount: i,
          isCorrect: true,
          difficultyScore: 70, // HARD
          timeSpentSeconds: 60,
          avgTimeForDifficulty: 60,
          daysSinceLastAttempt: 0,
        });
        mastery = result.newMastery;
      }
      // Should be more than easy answers
      expect(mastery).toBeGreaterThan(10);
      expect(mastery).toBeLessThan(60);
    });

    it("mastery 90 with easy correct gives minimal increase", () => {
      const result = computeNewMastery({
        currentMastery: 90,
        attemptCount: 100,
        isCorrect: true,
        difficultyScore: 20, // EASY
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      // Should be less than 1 point
      expect(result.delta).toBeLessThan(1);
      expect(result.newMastery).toBeLessThan(91);
    });

    it("mastery 50 with easy incorrect gives larger decrease than hard incorrect", () => {
      // Use different mastery levels to test the effect
      const easyWrong = computeNewMastery({
        currentMastery: 50,
        attemptCount: 5, // fewer attempts = higher confidence factor
        isCorrect: false,
        difficultyScore: 20, // EASY
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });

      const hardWrong = computeNewMastery({
        currentMastery: 50,
        attemptCount: 5,
        isCorrect: false,
        difficultyScore: 70, // HARD
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });

      // Easy wrong should decrease more than hard wrong
      expect(easyWrong.delta).toBeLessThan(hardWrong.delta);
    });

    it("applies decay after 7 days", () => {
      const result = computeNewMastery({
        currentMastery: 50,
        attemptCount: 20,
        isCorrect: true,
        difficultyScore: 50,
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 14, // 7 days of decay
      });
      // Should have decay component
      expect(result.components.decay).toBeGreaterThan(0);
      // New mastery should be less than it would be without decay
      const noDecay = computeNewMastery({
        currentMastery: 50,
        attemptCount: 20,
        isCorrect: true,
        difficultyScore: 50,
        timeSpentSeconds: 60,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      expect(result.newMastery).toBeLessThan(noDecay.newMastery);
    });

    it("clamps mastery between 0 and 100", () => {
      const highResult = computeNewMastery({
        currentMastery: 99,
        attemptCount: 1,
        isCorrect: true,
        difficultyScore: 100,
        timeSpentSeconds: 30,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      expect(highResult.newMastery).toBeLessThanOrEqual(100);

      const lowResult = computeNewMastery({
        currentMastery: 1,
        attemptCount: 1,
        isCorrect: false,
        difficultyScore: 0,
        timeSpentSeconds: 30,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      expect(lowResult.newMastery).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // computeConfidence
  // ═══════════════════════════════════════════════════════════════

  describe("computeConfidence", () => {
    it("increases with more attempts", () => {
      const low = computeConfidence({ attemptCount: 5, daysSinceLastAttempt: 0 });
      const high = computeConfidence({ attemptCount: 30, daysSinceLastAttempt: 0 });
      expect(high).toBeGreaterThan(low);
    });

    it("decreases with older attempts", () => {
      const recent = computeConfidence({ attemptCount: 10, daysSinceLastAttempt: 0 });
      const old = computeConfidence({ attemptCount: 10, daysSinceLastAttempt: 30 });
      expect(recent).toBeGreaterThan(old);
    });

    it("caps at 100", () => {
      const result = computeConfidence({ attemptCount: 100, daysSinceLastAttempt: 0 });
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // computeDecayAmount
  // ═══════════════════════════════════════════════════════════════

  describe("computeDecayAmount", () => {
    it("returns 0 within grace period", () => {
      expect(computeDecayAmount(7)).toBe(0);
      expect(computeDecayAmount(3)).toBe(0);
    });

    it("applies tier 1 decay (days 8-14)", () => {
      const decay = computeDecayAmount(10); // 3 days of decay
      expect(decay).toBe(1.5); // 3 * 0.5
    });

    it("applies tier 2 decay (days 15-30)", () => {
      const decay = computeDecayAmount(20); // 13 days of decay
      // 7 * 0.5 + 6 * 1.0 = 3.5 + 6 = 9.5
      expect(decay).toBe(9.5);
    });

    it("caps at DECAY_MAX", () => {
      const decay = computeDecayAmount(100); // many days
      expect(decay).toBeLessThanOrEqual(MASTERY_CONFIG.DECAY_MAX);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // computeDifficultyWeight
  // ═══════════════════════════════════════════════════════════════

  describe("computeDifficultyWeight", () => {
    it("higher weight when difficulty > mastery", () => {
      const weight = computeDifficultyWeight(90, 40); // gap = +50
      expect(weight).toBeGreaterThan(0.5);
    });

    it("lower weight when difficulty < mastery", () => {
      const weight = computeDifficultyWeight(20, 80); // gap = -60
      expect(weight).toBeLessThan(0.5);
    });

    it("clamps between 0.1 and 1.0", () => {
      const high = computeDifficultyWeight(100, 0);
      const low = computeDifficultyWeight(0, 100);
      expect(high).toBeLessThanOrEqual(1.0);
      expect(low).toBeGreaterThanOrEqual(0.1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // computeTimeFactor
  // ═══════════════════════════════════════════════════════════════

  describe("computeTimeFactor", () => {
    it("gives bonus for fast correct answer", () => {
      const factor = computeTimeFactor(true, 30, 60); // 50% of avg
      expect(factor).toBe(1.15);
    });

    it("gives penalty for too fast incorrect answer", () => {
      const factor = computeTimeFactor(false, 20, 60); // 33% of avg
      expect(factor).toBe(0.85);
    });

    it("returns 1.0 for normal speed", () => {
      const factor = computeTimeFactor(true, 60, 60); // 100% of avg
      expect(factor).toBe(1.0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // aggregateSubjectMastery
  // ═══════════════════════════════════════════════════════════════

  describe("aggregateSubjectMastery", () => {
    it("calculates weighted average", () => {
      const result = aggregateSubjectMastery({
        conceptMasteries: [
          { score: 80, confidence: 90, attemptCount: 30 },
          { score: 60, confidence: 50, attemptCount: 10 },
        ],
      });
      // Weighted toward higher confidence
      expect(result.score).toBeGreaterThan(60);
      expect(result.score).toBeLessThan(80);
    });

    it("counts mastered concepts", () => {
      const result = aggregateSubjectMastery({
        conceptMasteries: [
          { score: 90, confidence: 80, attemptCount: 30 },
          { score: 50, confidence: 60, attemptCount: 15 },
          { score: 95, confidence: 90, attemptCount: 40 },
        ],
      });
      expect(result.conceptsMastered).toBe(2);
      expect(result.conceptsTotal).toBe(3);
    });

    it("returns 0 for empty input", () => {
      const result = aggregateSubjectMastery({ conceptMasteries: [] });
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getMasteryLabel
  // ═══════════════════════════════════════════════════════════════

  describe("getMasteryLabel", () => {
    it("returns correct labels for ranges", () => {
      expect(getMasteryLabel(0).label).toBe("Baru Mulai");
      expect(getMasteryLabel(20).label).toBe("Belajar Dasar");
      expect(getMasteryLabel(45).label).toBe("Berkembang");
      expect(getMasteryLabel(65).label).toBe("Cukup Paham");
      expect(getMasteryLabel(80).label).toBe("Paham Baik");
      expect(getMasteryLabel(95).label).toBe("Menguasai");
    });
  });
});

describe("Difficulty System", () => {
  describe("difficultyToScore", () => {
    it("converts enum to score", () => {
      expect(difficultyToScore("EASY")).toBe(20);
      expect(difficultyToScore("MEDIUM")).toBe(45);
      expect(difficultyToScore("HARD")).toBe(70);
      expect(difficultyToScore("ADVANCED")).toBe(90);
    });
  });

  describe("scoreToDifficulty", () => {
    it("converts score to enum", () => {
      expect(scoreToDifficulty(20)).toBe("EASY");
      expect(scoreToDifficulty(45)).toBe("MEDIUM");
      expect(scoreToDifficulty(70)).toBe("HARD");
      expect(scoreToDifficulty(90)).toBe("ADVANCED");
    });
  });

  describe("selectTargetDifficulty", () => {
    it("selects difficulty above mastery", () => {
      const target = selectTargetDifficulty(50, 80);
      expect(target).toBeGreaterThan(50);
    });

    it("reduces target for low confidence", () => {
      const highConf = selectTargetDifficulty(50, 80);
      const lowConf = selectTargetDifficulty(50, 20);
      expect(lowConf).toBeLessThan(highConf);
    });
  });

  describe("isQuestionSuitable", () => {
    it("returns true for suitable difficulty", () => {
      expect(isQuestionSuitable(60, 50, 20)).toBe(true);
    });

    it("returns false for too difficult", () => {
      expect(isQuestionSuitable(90, 30, 20)).toBe(false);
    });

    it("returns false for too easy", () => {
      expect(isQuestionSuitable(10, 50, 20)).toBe(false);
    });
  });

  describe("legacyMasteryToNew", () => {
    it("converts 0-1 to 0-100", () => {
      expect(legacyMasteryToNew(0.8)).toBe(80);
      expect(legacyMasteryToNew(0)).toBe(0);
      expect(legacyMasteryToNew(1)).toBe(100);
    });
  });
});

describe("Running Score Behavior", () => {
  it("mastery fluctuates over 100 attempts (70% correct)", () => {
    let mastery = 0;
    const history: number[] = [mastery];

    for (let i = 0; i < 100; i++) {
      const isCorrect = Math.random() < 0.7; // 70% correct
      const difficulty = 40 + Math.random() * 30; // random difficulty 40-70

      const result = computeNewMastery({
        currentMastery: mastery,
        attemptCount: i,
        isCorrect,
        difficultyScore: difficulty,
        timeSpentSeconds: 45 + Math.random() * 30,
        avgTimeForDifficulty: 60,
        daysSinceLastAttempt: 0,
      });
      mastery = result.newMastery;
      history.push(mastery);
    }

    // Mastery should be in reasonable range after 100 attempts with 70% accuracy
    expect(mastery).toBeGreaterThan(20);
    expect(mastery).toBeLessThan(90);

    // Should show fluctuation (not monotonic increase)
    let increases = 0;
    let decreases = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i] > history[i - 1]) increases++;
      if (history[i] < history[i - 1]) decreases++;
    }
    expect(increases).toBeGreaterThan(30); // many increases
    expect(decreases).toBeGreaterThan(10); // some decreases
  });

  it("early attempts cause bigger swings than later attempts", () => {
    let masteryEarly = 0;
    let masteryLate = 50;

    // Early attempt (attemptCount = 1)
    const earlyResult = computeNewMastery({
      currentMastery: masteryEarly,
      attemptCount: 1,
      isCorrect: true,
      difficultyScore: 50,
      timeSpentSeconds: 60,
      avgTimeForDifficulty: 60,
      daysSinceLastAttempt: 0,
    });

    // Late attempt (attemptCount = 100)
    const lateResult = computeNewMastery({
      currentMastery: masteryLate,
      attemptCount: 100,
      isCorrect: true,
      difficultyScore: 50,
      timeSpentSeconds: 60,
      avgTimeForDifficulty: 60,
      daysSinceLastAttempt: 0,
    });

    // Early delta should be larger than late delta
    expect(Math.abs(earlyResult.delta)).toBeGreaterThan(
      Math.abs(lateResult.delta),
    );
  });
});
