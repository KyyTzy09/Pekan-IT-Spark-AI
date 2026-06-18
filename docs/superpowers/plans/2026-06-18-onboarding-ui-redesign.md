# Onboarding UI Redesign & Custom Subject Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign student onboarding flow into a premium glassmorphic UI and fix the custom subject generation validation blocker.

**Architecture:** Use `framer-motion` for animated page entries, staggered lists, and spring transitions. Restructure input validations and button handlers in the onboarding container.

**Tech Stack:** Next.js, React, TailwindCSS, Framer Motion, Lucide icons.

## Global Constraints
- Follow the established `kebab-case` and `PascalCase` file names.
- Ensure type-safe TS and clean Biome check.
- Do not add new external packages.

---

### Task 1: Fix Custom Subject Navigation and Validation

**Files:**
- Modify: [OnboardingWizardClient.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/OnboardingWizardClient.tsx)

**Interfaces:**
- Consumes: `generateCustomSubjectPretest` from `src/server/actions/generate-onboarding-pretest.ts`
- Produces: Correct footer button state and step progression.

- [ ] **Step 1: Implement reset handlers for state change**
  If the user edits the input values after a generation, clear `generatedQuestions` and `generatedSubjectData`.
  Update the following changes in the state initialization:
  ```tsx
  const handleNameChange = (val: string) => {
    setCustomName(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleContextChange = (val: string) => {
    setCustomContext(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleEducationLevelChange = (val: EducationLevel) => {
    setEducationLevel(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleGradeChange = (val: number) => {
    setGrade(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  ```

- [ ] **Step 2: Update footer button handlers**
  In [OnboardingWizardClient.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/OnboardingWizardClient.tsx#L521-L551), update the `Button` onClick and disabled props:
  ```tsx
  onClick={
    flow === "custom" && step === 1 && !isGenerating
      ? (generatedQuestions ? goNext : handleCustomGenerate)
      : goNext
  }
  disabled={
    isGenerating ||
    (flow === "custom" && step === 1
      ? (generatedQuestions ? false : customName.trim().length < 2)
      : !isStepValid(step))
  }
  ```

- [ ] **Step 3: Run Biome and type check**
  Run: `bun run lint` and `bun run typecheck`

- [ ] **Step 4: Commit changes**
  Run: `git commit -am "fix(onboarding): resolve custom subject generation validation deadlock"`

---

### Task 2: Redesign Welcome and Profile Steps

**Files:**
- Modify: [WelcomeStep.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/WelcomeStep.tsx)
- Modify: [ProfileStep.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/ProfileStep.tsx)

**Interfaces:**
- Standard onboarding inputs for student profile.

- [ ] **Step 1: Redesign WelcomeStep cards**
  Use `framer-motion` for entrance animation and select buttons:
  - Add staggered entry for headers and choice blocks.
  - Transform national/custom buttons into beautiful side-by-side or stacked glassmorphic cards with HSL accent border gradients and spring-loaded hover triggers.
  - Make `SparkCharacter` float gently with a CSS or Framer Motion animation.

- [ ] **Step 2: Redesign ProfileStep selection grid**
  - Add smooth transition for SMA/SMK select boxes using `framer-motion` layout animations.
  - Add visual cues (check marks, outline highlights) when items are selected.
  - Style the school name input field with a glowing focus ring.

- [ ] **Step 3: Commit changes**
  Run: `git commit -am "style(onboarding): redesign welcome and profile steps with motion"`

---

### Task 4: Redesign Custom Subject & Pretest Steps

**Files:**
- Modify: [CustomSubjectStep.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/CustomSubjectStep.tsx)
- Modify: [PretestStep.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/PretestStep.tsx)
- Modify: [CustomPretestStep.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/CustomPretestStep.tsx)

- [ ] **Step 1: Redesign Custom Subject input form and loading animation**
  - Enhance the popular ideas pills to pop nicely.
  - Beautify the AI generation loading state with glowing pulse ring, bouncing stars, and detailed status updates.

- [ ] **Step 2: Redesign pretest question containers and options**
  - Animate question blocks sliding up.
  - Give choice buttons standard hover transitions, showing correct letters (A, B, C, D) inside styled badge circles that fill with brand color on selection.

- [ ] **Step 3: Commit changes**
  Run: `git commit -am "style(onboarding): enhance custom subject steps and pretest UI"`

---

### Task 5: Verify Everything

- [ ] **Step 1: Check build**
  Run: `bun run build`

- [ ] **Step 2: Check linting and Biome format**
  Run: `bun run format && bun run lint`
