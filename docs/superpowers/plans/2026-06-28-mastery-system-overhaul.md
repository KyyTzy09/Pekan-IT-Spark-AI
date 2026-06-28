# Mastery System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the simple EMA mastery system with a continuous running-score system (0-100) that incorporates difficulty weighting, confidence tracking, time-based decay, and integrates with AI generation.

**Architecture:** New `src/server/learning/mastery.ts` module handles all calculations. Existing `adaptive.ts` is deprecated. Schema gets new `StudentMastery` and `SubjectMastery` tables. `Question` model gets `difficultyScore` field.

**Tech Stack:** Prisma 7, PostgreSQL, TypeScript, Zod

## Global Constraints

- All mastery scores are 0-100 (not 0-1)
- All difficulty scores are 0-100 (not enum)
- Backward compatible: old `Difficulty` enum stays for existing data
- Migration converts old mastery (0-1) to new (0-100)
- All tests must pass before moving to next task

---

## Task 1: Schema Changes

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/..._add_mastery_tables/migration.sql`

**Changes:**
1. Add `StudentMastery` model
2. Add `SubjectMastery` model
3. Add `difficultyScore` to `Question` model
4. Keep old `StudentKnowledgeProfile` for backward compatibility

---

## Task 2: Core Mastery Module

**Files:**
- Create: `src/server/learning/mastery.ts`

**Functions:**
- `computeNewMastery()` — main calculation
- `applyDecay()` — time-based decay
- `computeConfidence()` — confidence score
- `computeDifficultyWeight()` — difficulty gap weighting
- `aggregateSubjectMastery()` — concept → subject aggregation

---

## Task 3: Difficulty Conversion

**Files:**
- Create: `src/server/learning/difficulty.ts`

**Functions:**
- `difficultyToScore()` — convert enum to 0-100
- `scoreToDifficulty()` — convert 0-100 to enum (for backward compat)
- `selectTargetDifficulty()` — select difficulty based on mastery

---

## Task 4: Update recordQuestionAttempt

**Files:**
- Modify: `src/server/actions/subjects.ts`

**Changes:**
- Use new mastery calculation
- Update `StudentMastery` table
- Update `SubjectMastery` aggregation
- Keep backward compat with old `StudentKnowledgeProfile`

---

## Task 5: Update Practice System

**Files:**
- Modify: `src/server/actions/practice.ts`

**Changes:**
- Use new mastery for adaptive difficulty
- Use new mastery for question selection
- Pass mastery context to AI

---

## Task 6: Update Challenge System

**Files:**
- Modify: `src/server/actions/challenges.ts`
- Modify: `src/server/actions/weekly-challenge.ts`

**Changes:**
- Use `SubjectMastery` for challenge difficulty
- Pass mastery context to AI generation

---

## Task 7: Update AI Generation

**Files:**
- Modify: `src/server/ai/challenge.ts`
- Modify: `src/server/ai/curriculum.ts`

**Changes:**
- Include mastery context in prompts
- Adjust difficulty based on mastery

---

## Task 8: Migration Script

**Files:**
- Create: `prisma/migrate-mastery.ts`

**Changes:**
- Convert old mastery (0-1) to new (0-100)
- Set confidence based on attempt count
- Populate difficultyScore for existing questions

---

## Task 9: UI Updates

**Files:**
- Modify: `src/components/student/concept-detail-dialog.tsx`
- Modify: `src/components/student/constellation-view.tsx`
- Modify: `src/components/student/challenge/challenge-list-view.tsx`

**Changes:**
- Display mastery as 0-100
- Show confidence indicator
- Show mastery trend (up/down/stable)
- New status labels based on score range

---

## Task 10: Tests

**Files:**
- Create: `src/server/learning/__tests__/mastery.test.ts`

**Tests:**
- Mastery increases on correct answer
- Mastery decreases on incorrect answer
- Difficulty weighting works correctly
- Decay applies after 7 days
- Confidence factor stabilizes over time
- Subject mastery aggregation works
