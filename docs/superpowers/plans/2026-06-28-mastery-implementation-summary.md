# Mastery System Overhaul — Implementation Summary

> **Date:** 2026-06-28
> **Status:** ✅ Core implementation complete

## What Was Built

### 1. New Schema Models

**`StudentMastery`** — Per-concept mastery tracking
- `score`: Float (0-100) — continuous mastery score
- `confidence`: Float (0-100) — how reliable the score is
- `attemptCount`, `correctCount`, `totalTimeSpent` — stats
- `peakScore` — highest score ever achieved
- `lastAttemptAt`, `lastDecayAt` — for decay tracking

**`SubjectMastery`** — Aggregated per-subject mastery
- `score`: Float (0-100) — weighted average of concept masteries
- `confidence`: Float (0-100) — aggregated confidence
- `conceptsMastered`, `conceptsTotal` — progress stats
- `recommendedDifficulty` — for AI generation

**`Question.difficultyScore`** — Continuous difficulty (0-100)
- Added alongside existing `difficulty` enum for backward compatibility

### 2. Core Modules

**`src/server/learning/mastery.ts`** — Main mastery calculation
- `computeNewMastery()` — running score that changes every attempt
- `computeConfidence()` — confidence based on attempt count + recency
- `computeDecayAmount()` — 7-day grace period, then tiered decay
- `computeDifficultyWeight()` — gap-based weighting
- `computeTimeFactor()` — bonus/penalty for answer speed
- `aggregateSubjectMastery()` — concept → subject aggregation
- `getMasteryLabel()` — UI labels (Baru Mulai → Menguasai)

**`src/server/learning/difficulty.ts`** — Difficulty conversion
- `difficultyToScore()` — enum → 0-100
- `scoreToDifficulty()` — 0-100 → enum
- `selectTargetDifficulty()` — based on mastery + confidence
- `selectChallengeDifficulty()` — 10% harder than mastery

### 3. Updated Systems

**`src/server/actions/subjects.ts`** — recordQuestionAttempt
- Uses new `StudentMastery` table
- Updates both new and old tables (backward compat)
- Aggregates subject mastery after each attempt

**`src/server/actions/practice.ts`** — Practice system
- Queries new `StudentMastery` table
- Uses 0-100 scale for mastery

**`src/server/actions/challenges.ts`** — Challenge system
- Queries new `StudentMastery` for weak/strong concepts
- Uses 0-100 scale for mastery thresholds

### 4. Tests

**`src/server/learning/__tests__/mastery.test.ts`** — 35 tests
- All passing ✅
- Covers: computeNewMastery, confidence, decay, difficulty weight, time factor, aggregation, running score behavior

### 5. Migration Script

**`prisma/migrate-mastery.ts`**
- Converts old mastery (0-1) to new (0-100)
- Sets confidence based on attempt count
- Populates difficultyScore for existing questions
- Aggregates SubjectMastery

---

## How Mastery Works Now

### Running Score (Not Rolling Window)

```
Attempt 1:   EASY benar    → mastery: 0 → 3.0     (+3.0)
Attempt 2:   EASY benar    → mastery: 3.0 → 5.8   (+2.8)
Attempt 3:   EASY salah    → mastery: 5.8 → 3.1   (-2.7)
Attempt 4:   MEDIUM benar  → mastery: 3.1 → 8.2   (+5.1)
...
Attempt 100: HARD benar    → mastery: 78.2 → 78.9 (+0.7)
```

### Key Behaviors

| Scenario | Old System | New System |
|----------|------------|------------|
| 5 easy correct | 0 → 67 | 0 → ~10 |
| 5 hard correct | 0 → 67 | 0 → ~25 |
| 100 attempts (70% correct) | ~70 (static) | ~70 (fluctuating) |
| No practice 14 days | unchanged | -7 points |
| Mastery 90, easy correct | small increase | +0.2 points |

### Decay Schedule

| Days Not Practicing | Decay Rate | Max Decay |
|---------------------|------------|-----------|
| 1-7 days | 0 (grace) | 0 |
| 8-14 days | 0.5/day | 3.5 |
| 15-30 days | 1.0/day | 15 |
| 31+ days | 1.5/day | 20 (cap) |

### Mastery Labels (UI)

| Range | Label | Color |
|-------|-------|-------|
| 0-15 | Baru Mulai | Gray |
| 16-35 | Belajar Dasar | Blue Light |
| 36-55 | Berkembang | Blue |
| 56-75 | Cukup Paham | Green Light |
| 76-88 | Paham Baik | Green |
| 89-100 | Menguasai | Gold |

---

## Files Changed

### New Files
- `src/server/learning/mastery.ts` — core mastery calculation
- `src/server/learning/difficulty.ts` — difficulty conversion
- `src/server/learning/__tests__/mastery.test.ts` — tests
- `prisma/migrate-mastery.ts` — migration script

### Modified Files
- `prisma/schema.prisma` — added StudentMastery, SubjectMastery, Question.difficultyScore
- `src/server/actions/subjects.ts` — updated recordQuestionAttempt
- `src/server/actions/practice.ts` — updated to use new mastery
- `src/server/actions/challenges.ts` — updated to use new mastery

### Backward Compatibility
- Old `StudentKnowledgeProfile` table still exists and is updated
- Old `Difficulty` enum still works (converted to score internally)
- Migration script converts old data to new format

---

## Next Steps

1. **Run migration** — `bun run prisma/migrate-mastery.ts`
2. **Create DB migration** — `bun run db:migrate`
3. **Update UI** — show new mastery labels, confidence indicator, trend
4. **Update AI prompts** — pass mastery context to question/material generation
5. **Test end-to-end** — verify mastery updates correctly in practice

---

## Success Criteria Met

✅ Mastery increases on correct answer
✅ Mastery decreases on incorrect answer  
✅ 5 easy correct gives modest increase (~10 points, not 67)
✅ 5 hard correct gives larger increase (~25 points)
✅ Mastery 90 + easy correct gives minimal increase (<1 point)
✅ Decay applies after 7 days
✅ Confidence stabilizes over time
✅ All 35 tests passing
