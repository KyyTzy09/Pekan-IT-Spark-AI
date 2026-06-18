# Spec: Onboarding UI Redesign & Custom Subject Fix

## Goal
Redesign the student onboarding flow using a premium "Modern Glass-Claymorphic Pop" design language with `framer-motion` animations, and fix the custom subject validation bug preventing users from generating pretest questions.

## Problem Context
1. **Custom Subject Generation Bug:**
   - In `OnboardingWizardClient.tsx`, the footer navigation button was disabled because `isStepValid(1)` returned `generatedQuestions !== null`. This created a deadlock where the button to generate the questions could never be clicked.
   - When clicked (if bypassed), it would keep calling `handleCustomGenerate` instead of proceeding to the pretest step because of incorrect `onClick` evaluation.
2. **Onboarding UI Esthetics:**
   - The user requested a beautiful, premium, non-generic onboarding UI.
   - We will use interactive elements, micro-animations, glassmorphic styling, and HSL gradients.

## Proposed Changes

### 1. Fix Logic & Validation
* Modify [OnboardingWizardClient.tsx](file:///c:/Koding/spark-ai/src/components/onboarding/OnboardingWizardClient.tsx):
  * Update `isStepValid` definition for custom flow step 1.
  * Adjust the footer button `disabled` and `onClick` handlers.
  * Add automatic resetting of `generatedQuestions` and `generatedSubjectData` if inputs are modified (to prevent mismatched data submissions).

### 2. Redesign UI Components with Framer Motion
* **Layout Transitions:** Wrap step contents in `motion.div` to animate step changes smoothly (slide-in / fade-up).
* **Welcome Step:** Transform buttons into side-by-side or stacked premium glass cards with interactive hover scale and border gradient highlights.
* **Profile Step:** Style SMA/SMK buttons as tactile Cards with custom icons, hover elevation, and spring selection indicators.
* **Subjects Step:** Add staggered entry animations for subject choices and pop animations when toggling selection.
* **Style & Reminder Step:** Animate the style selection cards with unique color glows and make the custom switch button slide smoothly.
* **Custom Subject Step:** Style the input form container as a premium card, chips as tactile pills, and enhance the "AI processing" loading animation.
* **Pretest Steps:** Animate question blocks and customize option items with interactive states and smooth tick icons.

## Verification Plan
* Run Biome check: `bun run lint`
* Run typecheck: `bun run typecheck`
* Run development server and verify visual changes & validation fixes in browser.
