# Design Spec: Custom Subjects, Challenges, and Manual Material Generation

This design specification details the requirements, architecture, and implementation details for enabling daily/weekly challenges on custom subjects, restricting challenges to favorite subjects, providing a user interface to edit favorite subjects, and enabling manual (on-demand) material generation that adapts to the student's skill level.

## 1. Requirements

### Daily & Weekly Challenges for Custom Subjects
1. Custom subjects must automatically be added to the student's favorite subjects (`focusedSubjects`) upon generation (already partially done, but need to ensure it works correctly).
2. Daily and weekly challenge generators must support custom subjects.
3. Currently, custom subjects get mapped to `subjectId = null` because the challenge generator AI is constrained to a static enum of slugs in the system prompt. We need to pass the actual slugs dynamically so that the generated challenges are correctly associated with the custom subjects.

### Restricting Challenges to Favorite Subjects
1. ONLY subjects marked as favorite/liked (`focusedSubjects`) will be eligible for daily/weekly challenges.
2. If `focusedSubjects` is empty, no challenges should be generated, and a message should guide the user to select their favorite subjects first.

### Editing Favorite Subjects
1. Implement a Server Action to save all selected favorite subjects.
2. Build an `EditFavoritesDialog` UI component where students can toggle checkmarks for any available subject (national and custom) and save their favorite list.

### Manual Material Generation & Explorer Filter
1. **Explanation**: Subject generation creates concepts with initial summary content (`contentMd` on the `Concept` model) and practice questions, but does not create `Material` database records. Thus, custom subjects were missing from the filter on the materials page.
2. Update the materials page filter query so that it includes all of the user's favorite/focused subjects and custom subjects, even if they have 0 generated materials yet.
3. Allow the user to manually trigger material generation for a subject.
4. The manual material generator must dynamically select the student's weakest concept under that subject (lowest mastery score) and call the AI to generate a detailed reading material customized to the student's learning style (e.g. Mermaid.js diagrams for VISUAL, case studies for EXAMPLE_HEAVY, etc.) and grade level.

---

## 2. Architecture & Data Flow

### Challenge Subject Selector & AI Normalization
When generating daily challenges:
1. Retrieve `focusedSubjectIds` from the student's profile.
2. Fetch the corresponding subjects, retrieving both their `name` and `slug`.
3. In `generateDailyMix`, construct the prompt by providing a dynamic list of valid slugs (including custom ones).
4. Update the `normalizeSubjectSlug` function and system prompt to dynamically accept any custom slug in the list of valid slugs.
5. In `getOrCreateWeeklyChallenge`, match the AI output to custom subjects using their exact names or slugs.

### Database Operations
1. Add `saveFavoriteSubjects` server action in `src/server/actions/subjects.ts` to update `focusedSubjects` array.
2. Add `generateMaterialAction` server action in `src/server/actions/challenges.ts` (or `subjects.ts`):
   - Find the target concept under the chosen subject by prioritizing concepts with mastery `< 0.7` and no existing material.
   - Invoke `generateOnDemandMaterial` AI helper.
   - Insert new `Material` record.

---

## 3. UI/UX Changes

### 1. Subjects Page — Edit Favorites Button & Dialog
- Location: `src/app/(student)/subjects/page.tsx` and `src/components/student/subjects-view.tsx`.
- Add an "Edit Favorit" button next to "+ Tambah mapel".
- When clicked, it opens `EditFavoritesDialog` showing a list of all subjects grouped by national/custom with checkmarks. Saving calls the server action and updates the cache.

### 2. Materials Library Page — Manual Generation
- Location: `src/app/(student)/materials/page.tsx` and `src/components/student/materials/materials-library-view.tsx`.
- Add a "+ Generate Materi AI" button in the filter section or as an empty state action when a subject has no materials.
- Clicking it opens a loading state, calls `generateMaterialAction`, and redirects/shows the generated material card.

---

## 4. Verification & Success Criteria

1. **Challenges**: Daily/weekly challenges contain items for custom subjects when custom subjects are in `focusedSubjects`.
2. **Strict filtering**: If `focusedSubjects` is empty, the challenge dashboard does not generate items and guides the user.
3. **Editing Favorites**: Users can add and remove subjects, verify DB state updates correctly.
4. **Materials**: Custom subjects are visible in the Materials dropdown. Manual generation creates a custom material that matches the user's learning style and grade level.
