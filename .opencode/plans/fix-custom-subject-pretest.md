# Fix Custom Subject Pretest: JSON Parsing + Answer Scoring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two bugs when creating custom subjects: (1) AI returns prose instead of JSON causing parse failure, (2) correct pretest answers are marked as wrong due to letter-vs-text format mismatch.

**Architecture:** Two independent fixes — (A) make `safeParseJson` more resilient to prose output from AI, (B) normalize answer comparison to handle both letter format (seed data) and full-text format (AI-generated data).

**Tech Stack:** Next.js, TypeScript, Prisma, Auth.js, Groq AI (llama-3.3-70b-versatile)

## Root Cause Analysis

### Bug 1: JSON Parse Error
- `src/server/ai/curriculum.ts:128-145` — `safeParseJson()` strips markdown fences then tries `JSON.parse()`
- Fallback: finds first `{` and last `}` to extract JSON substring
- **Failure:** When AI returns pure prose without any `{}` braces (e.g., `"Berikut adalah..."`), all fallbacks fail
- Error: `SyntaxError: Unexpected token 'B', "Berikut ad"... is not valid JSON`

### Bug 2: Correct Answers Marked Wrong
- **Format mismatch:** UI sends **letters** (A/B/C/D), but AI-generated `correctAnswer` stores **full text** (e.g., `"Metode create()"`)
- Seed data stores `correctAnswer` as letters → comparison works for national questions
- AI-generated data stores `correctAnswer` as full text → `"A" === "Metode create()"` → always false
- Affected locations:
  - `OnboardingWizardClient.tsx:265` (custom pretest, client-side)
  - `OnboardingWizardClient.tsx:232` (national pretest, client-side — works by coincidence since seed uses letters)
  - `practice.ts:733-735` (quiz-player, server-side)
  - `practice.ts:916-918` (practice-player, server-side)
  - `challenges.ts:667` (challenges, server-side — also case-sensitive bug)

## Global Constraints
- All comparisons must be case-insensitive
- Must handle both letter format (A/B/C/D) and full-text format for `correctAnswer`
- Must not break existing national (seed) questions
- Follow existing code style (Bahasa Indonesia comments, existing patterns)

---

### Task 1: Fix `safeParseJson` in curriculum.ts

**Files:**
- Modify: `src/server/ai/curriculum.ts:128-145`

**Interfaces:**
- Consumes: raw AI text output (may be prose, markdown-fenced JSON, or pure JSON)
- Produces: parsed JavaScript object

- [ ] **Step 1: Read the current `safeParseJson` function**

Read `src/server/ai/curriculum.ts` lines 128-145 to confirm current implementation.

- [ ] **Step 2: Improve `safeParseJson` with better extraction**

Replace the `safeParseJson` function (lines 128-145) with a more resilient version that:
1. Strips markdown code fences (existing)
2. Tries direct `JSON.parse` (existing)
3. Tries extracting JSON object using balanced brace matching
4. Better error message on failure

```typescript
function safeParseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // Try nested brace matching for cases where there are extra } at the end
        let depth = 0;
        let end = -1;
        for (let i = firstBrace; i < cleaned.length; i++) {
          if (cleaned[i] === "{") depth++;
          if (cleaned[i] === "}") depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
        if (end > firstBrace) {
          try {
            return JSON.parse(cleaned.slice(firstBrace, end + 1));
          } catch {
            // fall through
          }
        }
      }
    }
    throw new Error(`Failed to parse JSON from AI response: ${text.slice(0, 200)}...`);
  }
}
```

- [ ] **Step 3: Verify no type errors**

Run `bun run typecheck`.

- [ ] **Step 4: Commit**

```bash
git add src/server/ai/curriculum.ts
git commit -m "fix: improve safeParseJson to handle prose AI responses"
```

---

### Task 2: Fix answer comparison in OnboardingWizardClient.tsx

**Files:**
- Modify: `src/components/onboarding/OnboardingWizardClient.tsx:260-271`

**Interfaces:**
- Consumes: `customPretestAnswers[qi]` (letter: "A"/"B"/"C"/"D"), `q.correctAnswer` (full text or letter), `q.options` (array of 4 strings)
- Produces: `isCorrect` boolean

- [ ] **Step 1: Read the custom pretest comparison code**

Read `src/components/onboarding/OnboardingWizardClient.tsx` lines 254-272.

- [ ] **Step 2: Fix the comparison to resolve letter to option text**

Replace the `isCorrect` comparison in `handleCustomSubmit` (line 265):

**Before:**
```typescript
isCorrect: userAnswer.toUpperCase() === q.correctAnswer.toUpperCase(),
```

**After:**
```typescript
isCorrect: (() => {
  const letterIndex = userAnswer.charCodeAt(0) - 65;
  const resolvedAnswer = q.options[letterIndex] ?? userAnswer;
  return resolvedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
})(),
```

This converts the letter (A->0, B->1, etc.) to the actual option text, then compares against `correctAnswer`. Falls back to the raw letter if index is out of range (handles seed data where `correctAnswer` is already a letter).

- [ ] **Step 3: Also fix national pretest comparison (same pattern)**

Apply the same fix to `handleNationalSubmit` (line 232) for consistency. Need to check what fields `visiblePretest` has for options.

- [ ] **Step 4: Run typecheck**

Run `bun run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingWizardClient.tsx
git commit -m "fix: resolve letter-to-option-text before comparing correctAnswer"
```

---

### Task 3: Fix answer comparison in server-side actions

**Files:**
- Modify: `src/server/actions/practice.ts:733-735` (submitQuizAnswer)
- Modify: `src/server/actions/practice.ts:915-918` (submitPracticeAnswer)
- Modify: `src/server/actions/challenges.ts:666-667` (case-sensitive bug)

**Interfaces:**
- Consumes: `input.answer` (letter from client), `question.correctAnswer` (letter or full text), `question.options` (Json? field in DB)
- Produces: `isCorrect` boolean

- [ ] **Step 1: Create a shared helper function**

Add a helper that normalizes answer comparison:

```typescript
function answersMatch(
  userAnswer: string,
  correctAnswer: string,
  options?: unknown,
): boolean {
  const normalized = userAnswer.trim().toUpperCase();
  const correct = correctAnswer.trim().toUpperCase();

  // Direct match (handles both letter-to-letter and text-to-text)
  if (normalized === correct) return true;

  // If options provided, resolve letter to text and compare
  if (Array.isArray(options) && options.length > 0) {
    const letterIndex = normalized.charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < options.length) {
      const resolvedText = String(options[letterIndex]).trim().toUpperCase();
      if (resolvedText === correct) return true;
    }
  }

  return false;
}
```

- [ ] **Step 2: Update `submitQuizAnswer` to fetch options and use helper**

In `practice.ts`, update the Prisma query to also select `options`:
```typescript
const question = await prisma.question.findUnique({
  where: { id: input.questionId },
  select: { id: true, correctAnswer: true, explanation: true, options: true },
});
```

Replace the comparison (lines 733-735):
```typescript
const isCorrect = answersMatch(input.answer, question.correctAnswer, question.options);
```

- [ ] **Step 3: Update `submitPracticeAnswer` similarly**

In `practice.ts`, update `submitPracticeAnswer` to fetch `options` and use `answersMatch`.

- [ ] **Step 4: Fix case-sensitive comparison in `challenges.ts`**

In `challenges.ts` line 666-667, replace:
```typescript
const isCorrect =
  parsed.data.answer.trim() === item.question.correctAnswer.trim();
```
With (using `answersMatch` helper, and updating the query to fetch `options`).

- [ ] **Step 5: Run typecheck and lint**

```bash
bun run typecheck && bun run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/server/actions/practice.ts src/server/actions/challenges.ts
git commit -m "fix: normalize answer comparison to handle letter and text formats"
```

---

### Task 4: Verification

**Files:**
- No file changes

- [ ] **Step 1: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 2: Run lint**

```bash
bun run lint
```

- [ ] **Step 3: Manual test flow**

1. Create a custom subject in onboarding
2. Verify JSON generation succeeds (no parse error)
3. Take the pretest, answer correctly
4. Verify correct answers are marked as correct (not wrong)
5. Start a quiz for a national subject
6. Verify quiz answers still work correctly
