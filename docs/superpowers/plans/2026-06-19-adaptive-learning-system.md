# Adaptive Learning System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all learning content (practice questions + materials + document uploads) fully adaptive to user ability level.

**Architecture:** Three interconnected features sharing a common adaptive difficulty distribution engine. Practice questions are generated on-demand with difficulty mix based on mastery score. Materials are layered (added, not replaced) at progressive difficulty levels. Document uploads trigger pretest that feeds into the same mastery system.

**Tech Stack:** Next.js App Router, Prisma, Vercel AI SDK, Biome, Vitest (new)

## Global Constraints

- Bun runtime, Next.js 15, Prisma, TypeScript strict mode
- Biome for linting (no ESLint/Prettier)
- `"use server"` for all server actions
- No `any` types without justification
- Server Components by default, `"use client"` only when needed
- All new files follow existing naming: kebab-case for folders, PascalCase for components, kebab-case for utility files

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/server/ai/generate-questions.ts` | AI prompt + parsing for question generation |
| `src/server/ai/generate-adaptive-material.ts` | AI prompt + parsing for adaptive material generation |
| `src/server/ai/extract-document-concepts.ts` | AI concept extraction from uploaded documents |
| `src/server/actions/generate-practice-questions.ts` | Server action: generate questions for a subject |
| `src/server/actions/add-layered-material.ts` | Server action: add material at specific difficulty |
| `src/server/actions/document-pretest.ts` | Server action: generate + submit document pretest |
| `src/components/student/generate-practice-dialog.tsx` | UI: subject selection + count slider + generate |
| `src/components/student/material-levels-view.tsx` | UI: display material layers per concept |
| `src/components/student/document-pretest-view.tsx` | UI: pretest player for uploaded documents |
| `vitest.config.ts` | Vitest configuration |
| `src/server/ai/__tests__/generate-questions.test.ts` | Tests for question generation |
| `src/server/ai/__tests__/generate-adaptive-material.test.ts` | Tests for material generation |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/(student)/practice/page.tsx` | Add "Generate Soal" button in empty state |
| `src/components/student/subjects-view.tsx` | Add "Generate Latihan Soal" in context menu |
| `src/components/student/upload-workspace-view.tsx` | Add pretest button + pretest view |
| `src/server/ai/curriculum.ts` | Add `computeDifficultyDistribution` function |
| `package.json` | Add vitest devDependency |

---

## Task 1: Setup Vitest Test Framework

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
bun add -d vitest
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Run test to verify setup**

```bash
bun run test
```

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "chore: setup vitest test framework"
```

---

## Task 2: Add computeDifficultyDistribution to Curriculum

**Files:**
- Create: `src/server/ai/__tests__/generate-questions.test.ts`
- Modify: `src/server/ai/curriculum.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { computeDifficultyDistribution } from "@/server/ai/curriculum";

describe("computeDifficultyDistribution", () => {
  it("returns 60/30/10 for STRUGGLING (mastery < 0.4)", () => {
    const result = computeDifficultyDistribution(0.2, 10);
    expect(result.easy).toBe(6);
    expect(result.medium).toBe(3);
    expect(result.hard).toBe(1);
  });

  it("returns 20/50/30 for LEARNING (mastery 0.4-0.7)", () => {
    const result = computeDifficultyDistribution(0.5, 10);
    expect(result.easy).toBe(2);
    expect(result.medium).toBe(5);
    expect(result.hard).toBe(3);
  });

  it("returns 10/30/60 for MASTERED (mastery >= 0.7)", () => {
    const result = computeDifficultyDistribution(0.8, 10);
    expect(result.easy).toBe(1);
    expect(result.medium).toBe(3);
    expect(result.hard).toBe(6);
  });

  it("handles small counts correctly", () => {
    const result = computeDifficultyDistribution(0.2, 3);
    expect(result.easy + result.medium + result.hard).toBe(3);
    expect(result.easy).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/server/ai/__tests__/generate-questions.test.ts
```

- [ ] **Step 3: Write minimal implementation**

Add to `src/server/ai/curriculum.ts`:

```typescript
export function computeDifficultyDistribution(
  masteryScore: number,
  totalCount: number,
): { easy: number; medium: number; hard: number } {
  let easyRatio: number;
  let mediumRatio: number;
  let hardRatio: number;

  if (masteryScore < 0.4) {
    easyRatio = 0.6;
    mediumRatio = 0.3;
    hardRatio = 0.1;
  } else if (masteryScore < 0.7) {
    easyRatio = 0.2;
    mediumRatio = 0.5;
    hardRatio = 0.3;
  } else {
    easyRatio = 0.1;
    mediumRatio = 0.3;
    hardRatio = 0.6;
  }

  const easy = Math.max(1, Math.ceil(totalCount * easyRatio));
  const medium = Math.max(1, Math.ceil(totalCount * mediumRatio));
  const hard = totalCount - easy - medium;

  if (hard < 1) {
    return { easy: easy - 1, medium, hard: 1 };
  }

  return { easy, medium, hard };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/server/ai/__tests__/generate-questions.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/server/ai/curriculum.ts src/server/ai/__tests__/generate-questions.test.ts
git commit -m "feat: add computeDifficultyDistribution for adaptive question generation"
```

---

## Task 3: Create Question Generation AI Module

**Files:**
- Create: `src/server/ai/generate-questions.ts`

- [ ] **Step 1: Create generate-questions.ts**

```typescript
import { generateText } from "@/lib/ai";
import { z } from "zod";

const generatedQuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export async function generateQuestionsForConcept(input: {
  conceptName: string;
  conceptDescription: string;
  contentMd: string;
  learningStyle: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}): Promise<GeneratedQuestion[]> {
  const totalCount = input.easyCount + input.mediumCount + input.hardCount;

  const styleInstructions: Record<string, string> = {
    VISUAL: "Gunakan analogi visual dan contoh konkret dalam soal.",
    TEXTUAL: "Buatkan soal berbasis teks dan definisi formal.",
    EXAMPLE_HEAVY: "Buatkan soal berbasis studi kasus dan contoh nyata.",
    SOCRATIC: "Buatkan soal yang mendorong pemikiran kritis dan analisis.",
  };

  const { text } = await generateText({
    model: "chat",
    prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan ${totalCount} soal latihan pilihan ganda untuk konsep berikut:

Konsep: ${input.conceptName}
Deskripsi: ${input.conceptDescription}
Materi: ${input.contentMd.slice(0, 3000)}

Distribusi soal:
- EASY: ${input.easyCount} soal (pemahaman dasar, definisi, identifikasi)
- MEDIUM: ${input.mediumCount} soal (aplikasi, contoh soal, interpretasi)
- HARD: ${input.hardCount} soal (analisis, soal cerita kompleks, evaluasi)

Gaya belajar: ${styleInstructions[input.learningStyle] || styleInstructions.VISUAL}

Aturan:
1. Setiap soal punya 4 opsi (A, B, C, D)
2. correctAnswer harus persis sama dengan salah satu opsi (termasuk huruf awal)
3. Sertakan penjelasan jawaban
4. Sesuaikan kesulitan dengan label yang diminta
5. Gunakan bahasa Indonesia yang baik dan benar

Output JSON:
{
  "questions": [
    {
      "questionText": "Pertanyaan...",
      "options": ["A. Jawaban1", "B. Jawaban2", "C. Jawaban3", "D. Jawaban4"],
      "correctAnswer": "A. Jawaban1",
      "explanation": "Penjelasan...",
      "difficulty": "EASY"
    }
  ]
}`,
    temperature: 0.5,
  });

  const parsed = generatedQuestionsSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse generated questions: ${parsed.error.message}`);
  }
  return parsed.data.questions;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/server/ai/generate-questions.ts
git commit -m "feat: add generateQuestionsForConcept AI module"
```

---

## Task 4: Create Adaptive Material Generation AI Module

**Files:**
- Create: `src/server/ai/generate-adaptive-material.ts`
- Create: `src/server/ai/__tests__/generate-adaptive-material.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { getMaterialDifficultyInstructions } from "@/server/ai/generate-adaptive-material";

describe("getMaterialDifficultyInstructions", () => {
  it("returns EASY instructions for mastery < 0.4", () => {
    const instructions = getMaterialDifficultyInstructions(0.2);
    expect(instructions).toContain("sederhana");
    expect(instructions).toContain("analogi");
  });

  it("returns MEDIUM instructions for mastery 0.4-0.7", () => {
    const instructions = getMaterialDifficultyInstructions(0.5);
    expect(instructions).toContain("teknis");
  });

  it("returns HARD instructions for mastery >= 0.7", () => {
    const instructions = getMaterialDifficultyInstructions(0.8);
    expect(instructions).toContain("advanced");
    expect(instructions).toContain("studi kasus");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test src/server/ai/__tests__/generate-adaptive-material.test.ts
```

- [ ] **Step 3: Create generate-adaptive-material.ts**

```typescript
import { generateText } from "@/lib/ai";
import { z } from "zod";

const generatedMaterialSchema = z.object({
  title: z.string(),
  contentMd: z.string(),
  keyPoints: z.array(z.string()),
  estimatedMinutes: z.number(),
});

export type GeneratedAdaptiveMaterial = z.infer<typeof generatedMaterialSchema>;

export function getMaterialDifficultyInstructions(masteryScore: number): string {
  if (masteryScore < 0.4) {
    return `EASY - Materi untuk pemula:
- Gunakan bahasa sederhana dan sehari-hari
- Berikan banyak analogi dari kehidupan nyata
- Langkah demi langkah (step-by-step)
- Contoh konkret yang mudah dipahami
- Hindari istilah teknis yang rumit`;
  }
  if (masteryScore < 0.7) {
    return `MEDIUM - Materi menengah:
- Penjelasan teknis yang terstruktur
- Contoh aplikasi di dunia nyata
- Hubungkan dengan konsep lain yang sudah dipelajari
- Gunakan istilah teknis dengan penjelasan
- Sertakan diagram atau tabel jika relevan`;
  }
  return `HARD - Materi lanjutan:
- Analisis mendalam dan komprehensif
- Terminologi advanced dan istilah spesifik
- Studi kasus kompleks
- Perbandingan teori atau pendekatan berbeda
- Tantang pemahaman dengan pertanyaan retoris`;
}

export async function generateAdaptiveMaterial(input: {
  conceptName: string;
  conceptDescription: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  learningStyle: string;
  masteryScore: number;
}): Promise<GeneratedAdaptiveMaterial> {
  const styleInstructions: Record<string, string> = {
    VISUAL: "Sertakan diagram Mermaid.js dan visualisasi data.",
    TEXTUAL: "Gunakan format teks terstruktur dengan heading dan bullet points.",
    EXAMPLE_HEAVY: "Sertakan banyak contoh nyata dan studi kasus.",
    SOCRATIC: "Gunakan dialog tanya-jawab untuk menjelaskan konsep.",
  };

  const difficultyInstructions = getMaterialDifficultyInstructions(input.masteryScore);

  const { text } = await generateText({
    model: "chat",
    prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan materi belajar untuk konsep berikut:

Konsep: ${input.conceptName}
Deskripsi: ${input.conceptDescription}
Difficulty: ${input.difficulty}
Tingkat pemahaman siswa: ${Math.round(input.masteryScore * 100)}%

Instruksi difficulty:
${difficultyInstructions}

Gaya belajar: ${styleInstructions[input.learningStyle] || styleInstructions.VISUAL}

Aturan:
1. Materi dalam format Markdown yang bersih
2. Panjang: 300-800 kata
3. Sertakan minimal 3 key points
4. Estimasi waktu baca: 3-15 menit
5. Gunakan bahasa Indonesia yang baik dan benar
6. Sertakan contoh yang relevan

Output JSON:
{
  "title": "Judul Materi",
  "contentMd": "Isi materi dalam Markdown...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedMinutes": 5
}`,
    temperature: 0.5,
  });

  const parsed = generatedMaterialSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse generated material: ${parsed.error.message}`);
  }
  return parsed.data;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test src/server/ai/__tests__/generate-adaptive-material.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/server/ai/generate-adaptive-material.ts src/server/ai/__tests__/generate-adaptive-material.test.ts
git commit -m "feat: add adaptive material generation with difficulty-based instructions"
```

---

## Task 5: Create Document Concept Extraction Module

**Files:**
- Create: `src/server/ai/extract-document-concepts.ts`

- [ ] **Step 1: Create extract-document-concepts.ts**

```typescript
import { generateText } from "@/lib/ai";
import { z } from "zod";

const extractedConceptSchema = z.object({
  name: z.string(),
  description: z.string(),
  importance: z.number().min(1).max(5),
});

const extractedConceptsSchema = z.object({
  concepts: z.array(extractedConceptSchema),
});

export type ExtractedConcept = z.infer<typeof extractedConceptSchema>;

export async function extractConceptsFromDocument(
  content: string,
): Promise<ExtractedConcept[]> {
  const truncated = content.slice(0, 12000);

  const { text } = await generateText({
    model: "fast",
    prompt: `Ekstrak konsep-konsep kunci dari dokumen berikut.

Dokumen:
${truncated}

Untuk setiap konsep, buatkan:
- Nama konsep (singkat, jelas, maksimal 50 karakter)
- Deskripsi (1-2 kalimat, maksimal 100 karakter)
- Tingkat kepentingan (1-5, 5 = paling penting)

Fokus pada konsep yang bisa diuji dengan soal pilihan ganda.
Ambil maksimal 8 konsep terpenting.

Output JSON:
{
  "concepts": [
    {
      "name": "Nama Konsep",
      "description": "Deskripsi konsep",
      "importance": 5
    }
  ]
}`,
    temperature: 0.3,
  });

  const parsed = extractedConceptsSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse extracted concepts: ${parsed.error.message}`);
  }
  return parsed.data.concepts;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/server/ai/extract-document-concepts.ts
git commit -m "feat: add document concept extraction for pretest generation"
```

---

## Task 6: Create Generate Practice Questions Server Action

**Files:**
- Create: `src/server/actions/generate-practice-questions.ts`

- [ ] **Step 1: Create generate-practice-questions.ts**

```typescript
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDifficultyDistribution } from "@/server/ai/curriculum";
import { generateQuestionsForConcept } from "@/server/ai/generate-questions";

const generateSchema = z.object({
  subjectId: z.string().min(1),
  totalCount: z.number().int().min(3).max(15),
});

export type GeneratePracticeQuestionsInput = z.infer<typeof generateSchema>;

export async function generatePracticeQuestionsForSubject(
  input: GeneratePracticeQuestionsInput,
): Promise<{ ok: boolean; generated?: number; subjectName?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const { subjectId, totalCount } = parsed.data;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true },
  });
  if (!subject) {
    return { ok: false, error: "Mapel tidak ditemukan." };
  }

  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId } },
    select: {
      id: true,
      name: true,
      description: true,
      contentMd: true,
      topic: { select: { name: true } },
    },
  });

  if (concepts.length === 0) {
    return { ok: false, error: "Belum ada konsep untuk mapel ini." };
  }

  const profiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId: session.user.id, conceptId: { in: concepts.map((c) => c.id) } },
    select: { conceptId: true, masteryScore: true },
  });

  const masteryByConcept = new Map<string, number>();
  for (const p of profiles) {
    masteryByConcept.set(p.conceptId, p.masteryScore);
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { learningStyle: true },
  });
  const learningStyle = profile?.learningStyle ?? "VISUAL";

  let totalGenerated = 0;

  for (const concept of concepts) {
    const mastery = masteryByConcept.get(concept.id) ?? 0;
    const questionsPerConcept = Math.max(1, Math.ceil(totalCount / concepts.length));
    const distribution = computeDifficultyDistribution(mastery, questionsPerConcept);

    try {
      const questions = await generateQuestionsForConcept({
        conceptName: concept.name,
        conceptDescription: concept.description || concept.topic.name,
        contentMd: concept.contentMd || "",
        learningStyle,
        easyCount: distribution.easy,
        mediumCount: distribution.medium,
        hardCount: distribution.hard,
      });

      if (questions.length > 0) {
        await prisma.question.createMany({
          data: questions.map((q) => ({
            conceptId: concept.id,
            type: "MULTIPLE_CHOICE" as const,
            difficulty: q.difficulty,
            bloomTaxonomy: "UNDERSTAND" as const,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            hint: null,
            commonMisconceptions: null,
            tags: ["practice", "ai-generated", "on-demand"],
            isActive: true,
          })),
        });
        totalGenerated += questions.length;
      }
    } catch (err) {
      console.error(`Failed to generate questions for concept ${concept.name}:`, err);
    }
  }

  return { ok: true, generated: totalGenerated, subjectName: subject.name };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/generate-practice-questions.ts
git commit -m "feat: add generatePracticeQuestionsForSubject server action"
```

---

## Task 7: Create Add Layered Material Server Action

**Files:**
- Create: `src/server/actions/add-layered-material.ts`

- [ ] **Step 1: Create add-layered-material.ts**

```typescript
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAdaptiveMaterial } from "@/server/ai/generate-adaptive-material";

const addMaterialSchema = z.object({
  conceptId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export type AddLayeredMaterialInput = z.infer<typeof addMaterialSchema>;

export async function addAdvancedMaterial(
  input: AddLayeredMaterialInput,
): Promise<{ ok: boolean; materialId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = addMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const { conceptId, difficulty } = parsed.data;

  const existingMaterial = await prisma.material.findFirst({
    where: { conceptId, difficulty, source: "ADAPTIVE" },
  });
  if (existingMaterial) {
    return { ok: false, error: `Materi ${difficulty} sudah ada.` };
  }

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      id: true,
      name: true,
      description: true,
      topic: { select: { subjectId: true } },
    },
  });
  if (!concept) {
    return { ok: false, error: "Konsep tidak ditemukan." };
  }

  const profile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId: session.user.id, conceptId } },
    select: { masteryScore: true },
  });
  const masteryScore = profile?.masteryScore ?? 0;

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { learningStyle: true },
  });
  const learningStyle = studentProfile?.learningStyle ?? "VISUAL";

  try {
    const material = await generateAdaptiveMaterial({
      conceptName: concept.name,
      conceptDescription: concept.description || "",
      difficulty,
      learningStyle,
      masteryScore,
    });

    const created = await prisma.material.create({
      data: {
        title: material.title,
        content: material.contentMd,
        keyPoints: material.keyPoints,
        difficulty,
        estimatedMinutes: material.estimatedMinutes,
        source: "ADAPTIVE",
        conceptId,
        subjectId: concept.topic.subjectId,
        userId: session.user.id,
      },
    });

    return { ok: true, materialId: created.id };
  } catch (err) {
    console.error("Failed to generate adaptive material:", err);
    return { ok: false, error: "Gagal generate materi. Coba lagi." };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/add-layered-material.ts
git commit -m "feat: add addAdvancedMaterial server action for layered materials"
```

---

## Task 8: Create Document Pretest Server Actions

**Files:**
- Create: `src/server/actions/document-pretest.ts`

- [ ] **Step 1: Create document-pretest.ts**

```typescript
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractConceptsFromDocument } from "@/server/ai/extract-document-concepts";
import { generateQuestionsForConcept } from "@/server/ai/generate-questions";
import { computeDifficultyDistribution } from "@/server/ai/curriculum";

const submitPretestSchema = z.object({
  documentId: z.string().min(1),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      answer: z.string(),
      isCorrect: z.boolean(),
      conceptName: z.string(),
    }),
  ),
});

export async function generateDocumentPretest(documentId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false as const, error: "Kamu harus login dulu." };
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true, content: true },
  });
  if (!doc || doc.userId !== session.user.id) {
    return { ok: false as const, error: "Dokumen tidak ditemukan." };
  }

  const concepts = await extractConceptsFromDocument(doc.content);
  if (concepts.length === 0) {
    return { ok: false as const, error: "Tidak bisa mengekstrak konsep dari dokumen." };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { learningStyle: true },
  });
  const learningStyle = profile?.learningStyle ?? "VISUAL";

  const questions: Array<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    conceptName: string;
  }> = [];

  for (const concept of concepts) {
    const distribution = computeDifficultyDistribution(0, 3);
    try {
      const generated = await generateQuestionsForConcept({
        conceptName: concept.name,
        conceptDescription: concept.description,
        contentMd: doc.content.slice(0, 3000),
        learningStyle,
        easyCount: distribution.easy,
        mediumCount: distribution.medium,
        hardCount: distribution.hard,
      });

      for (const q of generated) {
        questions.push({ ...q, conceptName: concept.name });
      }
    } catch (err) {
      console.error(`Failed to generate pretest questions for concept: ${concept.name}`, err);
    }
  }

  return { ok: true as const, questions };
}

export async function submitDocumentPretest(input: unknown) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false as const, error: "Kamu harus login dulu." };
  }

  const parsed = submitPretestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const { documentId, answers } = parsed.data;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });
  if (!doc || doc.userId !== session.user.id) {
    return { ok: false as const, error: "Dokumen tidak ditemukan." };
  }

  const conceptAccuracy = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const bucket = conceptAccuracy.get(a.conceptName) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (a.isCorrect) bucket.correct += 1;
    conceptAccuracy.set(a.conceptName, bucket);
  }

  let updatedCount = 0;
  for (const [conceptName, { correct, total }] of conceptAccuracy) {
    const ratio = total > 0 ? correct / total : 0;
    const masteryScore = Math.round(ratio * 100) / 100;

    const concept = await prisma.concept.findFirst({
      where: { name: { equals: conceptName, mode: "insensitive" } },
      select: { id: true },
    });
    if (!concept) continue;

    await prisma.studentKnowledgeProfile.upsert({
      where: { userId_conceptId: { userId: session.user.id, conceptId: concept.id } },
      update: {
        masteryScore,
        status: ratio >= 0.8 ? "MASTERED" : ratio > 0 ? "LEARNING" : "STRUGGLING",
        attemptCount: { increment: total },
        lastAttemptAt: new Date(),
      },
      create: {
        userId: session.user.id,
        conceptId: concept.id,
        masteryScore,
        status: ratio >= 0.8 ? "MASTERED" : ratio > 0 ? "LEARNING" : "STRUGGLING",
        attemptCount: total,
        lastAttemptAt: new Date(),
      },
    });
    updatedCount++;
  }

  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  return {
    ok: true as const,
    stats: { total: answers.length, correct: totalCorrect, conceptsUpdated: updatedCount },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/document-pretest.ts
git commit -m "feat: add document pretest generation and submission with mastery integration"
```

---

## Task 9: Create GeneratePracticeDialog Component

**Files:**
- Create: `src/components/student/generate-practice-dialog.tsx`

- [ ] **Step 1: Create generate-practice-dialog.tsx**

```tsx
"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function GeneratePracticeDialog({
  open,
  onClose,
  subjects,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  onGenerate: (subjectId: string, count: number) => Promise<void>;
}) {
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);
  const [count, setCount] = React.useState(5);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    try {
      await onGenerate(selectedSubject, count);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isGenerating) onClose();
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border border-border/40">
        <DialogHeader className="flex-row items-start justify-between gap-3 border-border/40 border-b p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
              Generate Soal
            </p>
            <DialogTitle className="mt-1 font-heading text-[18px] font-bold">
              Pilih Mapel
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-border/40 bg-background/60 text-muted-foreground"
          >
            <X size={14} />
          </button>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubject(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  selectedSubject === s.id
                    ? "border-[var(--purple)]/40 bg-[var(--purple)]/8 ring-1 ring-[var(--purple)]/30"
                    : "border-border/30 bg-background/40 hover:border-border/60",
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-white"
                  style={{
                    background: s.color
                      ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                      : "linear-gradient(135deg, var(--coral), var(--orange))",
                  }}
                >
                  <span className="text-[14px]">{s.icon ?? "📚"}</span>
                </span>
                <span className="text-[12px] font-semibold text-foreground truncate">
                  {s.name}
                </span>
              </button>
            ))}
          </div>

          {selectedSubject && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Jumlah Soal: {count}
              </label>
              <input
                type="range"
                min={3}
                max={15}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-[var(--purple)]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3</span>
                <span>15</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedSubject || isGenerating}
            className="w-full rounded-xl bg-[var(--purple)] text-white font-bold"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate {count} Soal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/student/generate-practice-dialog.tsx
git commit -m "feat: add GeneratePracticeDialog component"
```

---

## Task 10: Create MaterialLevelsView Component

**Files:**
- Create: `src/components/student/material-levels-view.tsx`

- [ ] **Step 1: Create material-levels-view.tsx**

```tsx
"use client";

import { Check, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addAdvancedMaterial } from "@/server/actions/add-layered-material";

type MaterialLevel = {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  label: string;
  exists: boolean;
};

const LEVELS: Omit<MaterialLevel, "exists">[] = [
  { difficulty: "EASY", label: "Materi Dasar" },
  { difficulty: "MEDIUM", label: "Materi Menengah" },
  { difficulty: "HARD", label: "Materi Lanjutan" },
];

export function MaterialLevelsView({
  conceptId,
  existingMaterials,
}: {
  conceptId: string;
  existingMaterials: Array<{ difficulty: string; id: string }>;
}) {
  const [loadingLevel, setLoadingLevel] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const levels: MaterialLevel[] = LEVELS.map((l) => ({
    ...l,
    exists: existingMaterials.some((m) => m.difficulty === l.difficulty),
  }));

  const handleAdd = async (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    setLoadingLevel(difficulty);
    setError(null);
    try {
      const result = await addAdvancedMaterial({ conceptId, difficulty });
      if (!result.ok) {
        setError(result.error || "Gagal generate materi");
      }
    } catch {
      setError("Gagal generate materi");
    } finally {
      setLoadingLevel(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Level Materi
      </p>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <Button
            key={level.difficulty}
            variant="outline"
            size="sm"
            onClick={() => handleAdd(level.difficulty)}
            disabled={level.exists || loadingLevel !== null}
            className={cn(
              "rounded-full text-[11px] font-bold",
              level.exists && "bg-[var(--teal)]/10 border-[var(--teal)]/30 text-[var(--teal)]",
            )}
          >
            {loadingLevel === level.difficulty ? (
              <Loader2 size={12} className="animate-spin" />
            ) : level.exists ? (
              <Check size={12} />
            ) : (
              <Plus size={12} />
            )}
            {level.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/student/material-levels-view.tsx
git commit -m "feat: add MaterialLevelsView component for layered materials"
```

---

## Task 11: Create DocumentPretestView Component

**Files:**
- Create: `src/components/student/document-pretest-view.tsx`

- [ ] **Step 1: Create document-pretest-view.tsx**

```tsx
"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PretestQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  conceptName: string;
};

export function DocumentPretestView({
  questions,
  onSubmit,
}: {
  questions: PretestQuestion[];
  onSubmit: (answers: Array<{ questionIndex: number; answer: string; isCorrect: boolean; conceptName: string }>) => Promise<void>;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [result, setResult] = React.useState<{ total: number; correct: number } | null>(null);

  const current = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];

  const handleSelect = (option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    const submittedAnswers = Object.entries(answers).map(([idx, answer]) => {
      const q = questions[Number(idx)];
      return {
        questionIndex: Number(idx),
        answer,
        isCorrect: answer === q.correctAnswer,
        conceptName: q.conceptName,
      };
    });

    const correct = submittedAnswers.filter((a) => a.isCorrect).length;
    setResult({ total: questions.length, correct });
    setSubmitted(true);
    await onSubmit(submittedAnswers);
  };

  if (result) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/80 p-6 text-center">
        <CheckCircle2 size={32} className="mx-auto text-[var(--teal)]" />
        <h3 className="mt-3 font-heading text-[18px] font-bold">Pretest Selesai!</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {result.correct} dari {result.total} benar ({Math.round((result.correct / result.total) * 100)}%)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
        <span>Soal {currentIndex + 1} / {questions.length}</span>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
          current.difficulty === "EASY" && "bg-emerald-100 text-emerald-700",
          current.difficulty === "MEDIUM" && "bg-amber-100 text-amber-700",
          current.difficulty === "HARD" && "bg-rose-100 text-rose-700",
        )}>
          {current.difficulty}
        </span>
      </div>

      <p className="text-[13px] font-medium text-foreground">{current.questionText}</p>

      <div className="space-y-2">
        {current.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "w-full rounded-xl border p-3 text-left text-[12px] font-medium transition-all",
              selectedAnswer === option
                ? "border-[var(--purple)]/40 bg-[var(--purple)]/8"
                : "border-border/30 hover:border-border/60",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {submitted && selectedAnswer && (
        <div className={cn(
          "rounded-xl border p-3 text-[11px]",
          selectedAnswer === current.correctAnswer
            ? "border-[var(--teal)]/30 bg-[var(--teal)]/5 text-[var(--teal)]"
            : "border-destructive/30 bg-destructive/5 text-destructive",
        )}>
          {selectedAnswer === current.correctAnswer ? "Benar!" : "Salah"}
          <p className="mt-1 text-muted-foreground">{current.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-xl"
        >
          Sebelumnya
        </Button>
        {currentIndex === questions.length - 1 ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="rounded-xl bg-[var(--purple)] text-white"
          >
            Selesai
            <ArrowRight size={12} />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="rounded-xl"
          >
            Selanjutnya
            <ArrowRight size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/student/document-pretest-view.tsx
git commit -m "feat: add DocumentPretestView component"
```

---

## Task 12: Integrate into Practice Page

**Files:**
- Modify: `src/app/(student)/practice/page.tsx`

- [ ] **Step 1: Add imports and state**

Add imports at top:
```tsx
import { GeneratePracticeDialog } from "@/components/student/generate-practice-dialog";
import { generatePracticeQuestionsForSubject } from "@/server/actions/generate-practice-questions";
```

Add state inside component:
```tsx
const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);

const handleGenerate = async (subjectId: string, count: number) => {
  const result = await generatePracticeQuestionsForSubject({ subjectId, totalCount: count });
  if (result.ok) {
    router.refresh();
  } else {
    alert(result.error || "Gagal generate soal");
  }
};
```

- [ ] **Step 2: Replace empty state block**

Replace the empty state (around line 168-189) with:
```tsx
{!nextResult.ok ? (
  <Reveal delay={80}>
    <div className="rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl">
      <Sparkles size={28} className="mx-auto text-[var(--coral)]" />
      <p className="mt-3 font-heading text-[16px] font-bold">
        Belum ada soal latihan
      </p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {nextResult.error || "Generate soal untuk mapel yang kamu inginkan."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button
          size="sm"
          className="rounded-full bg-[var(--purple)] text-white"
          onClick={() => setGenerateDialogOpen(true)}
        >
          <Sparkles size={13} />
          Generate Latihan Soal
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/subjects">Jelajahi mapel</Link>
        </Button>
      </div>
    </div>
    <GeneratePracticeDialog
      open={generateDialogOpen}
      onClose={() => setGenerateDialogOpen(false)}
      subjects={subjects}
      onGenerate={handleGenerate}
    />
  </Reveal>
) : (
  <Reveal delay={80}>
    <PracticePlayer
      initialSession={nextResult.session}
      initialStats={stats ?? FALLBACK_STATS}
      subjectSlug={subjectSlug}
      topicId={topicId}
    />
  </Reveal>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(student)/practice/page.tsx"
git commit -m "feat: add Generate Soal button to practice empty state"
```

---

## Task 13: Integrate into SubjectCard Context Menu

**Files:**
- Modify: `src/components/student/subjects-view.tsx`

- [ ] **Step 1: Add imports and state**

```tsx
import { GeneratePracticeDialog } from "@/components/student/generate-practice-dialog";
import { generatePracticeQuestionsForSubject } from "@/server/actions/generate-practice-questions";
import { Target } from "lucide-react";
```

Add state inside SubjectCard:
```tsx
const [practiceDialogOpen, setPracticeDialogOpen] = React.useState(false);
```

- [ ] **Step 2: Add menu item**

In context menu, add after "Generate Materi" button:
```tsx
<Button
  variant="ghost"
  size="sm"
  className="w-full justify-start gap-2 text-[12px]"
  onClick={() => {
    setMenuOpen(false);
    setPracticeDialogOpen(true);
  }}
>
  <Target size={14} className="text-[var(--blue)]" />
  Generate Latihan Soal
</Button>
```

- [ ] **Step 3: Add dialog render**

After context menu div:
```tsx
{practiceDialogOpen && (
  <GeneratePracticeDialog
    open={practiceDialogOpen}
    onClose={() => setPracticeDialogOpen(false)}
    subjects={[{ id: subject.id, name: subject.name, icon: subject.icon, color: subject.color }]}
    onGenerate={async (subjectId, count) => {
      const result = await generatePracticeQuestionsForSubject({ subjectId, totalCount: count });
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Gagal generate soal");
      }
    }}
  />
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/student/subjects-view.tsx
git commit -m "feat: add Generate Latihan Soal to subject card context menu"
```

---

## Task 14: Integrate MaterialLevelsView into Concept Detail

**Files:**
- Modify: `src/components/student/subjects-view.tsx` (TopicDetailView)

- [ ] **Step 1: Add MaterialLevelsView import**

```tsx
import { MaterialLevelsView } from "@/components/student/material-levels-view";
```

- [ ] **Step 2: Add to TopicDetailView**

After concept section:
```tsx
<MaterialLevelsView
  conceptId={concept.id}
  existingMaterials={concept.materials?.map((m) => ({ id: m.id, difficulty: m.difficulty })) || []}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/components/student/subjects-view.tsx
git commit -m "feat: integrate MaterialLevelsView into concept detail"
```

---

## Task 15: Integrate Document Pretest into Upload Workspace

**Files:**
- Modify: `src/components/student/upload/upload-workspace-view.tsx`

- [ ] **Step 1: Add imports and state**

```tsx
import { DocumentPretestView } from "@/components/student/document-pretest-view";
import { generateDocumentPretest, submitDocumentPretest } from "@/server/actions/document-pretest";
import { Target } from "lucide-react";
```

Add state:
```tsx
const [pretestQuestions, setPretestQuestions] = React.useState<any[] | null>(null);
const [pretestLoading, setPretestLoading] = React.useState(false);
```

- [ ] **Step 2: Add handlers**

```tsx
const handleStartPretest = async () => {
  setPretestLoading(true);
  try {
    const result = await generateDocumentPretest(document.id);
    if (result.ok) {
      setPretestQuestions(result.questions);
    } else {
      alert(result.error || "Gagal generate pretest");
    }
  } finally {
    setPretestLoading(false);
  }
};

const handleSubmitPretest = async (answers: any[]) => {
  const result = await submitDocumentPretest({ documentId: document.id, answers });
  if (result.ok) {
    alert(`Pretest selesai! ${result.stats.correct}/${result.stats.total} benar`);
    setPretestQuestions(null);
    router.refresh();
  }
};
```

- [ ] **Step 3: Add pretest button in summary tab**

```tsx
{!pretestQuestions && (
  <Button onClick={handleStartPretest} disabled={pretestLoading} className="rounded-full bg-amber-500 text-white">
    {pretestLoading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
    Mulai Pretest
  </Button>
)}
```

- [ ] **Step 4: Add pretest view**

```tsx
{pretestQuestions && (
  <DocumentPretestView questions={pretestQuestions} onSubmit={handleSubmitPretest} />
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
bun run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/student/upload/upload-workspace-view.tsx
git commit -m "feat: integrate document pretest into upload workspace"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Run all tests**

```bash
bun run test
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```

- [ ] **Step 3: Run lint**

```bash
bun run lint
```

- [ ] **Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete adaptive learning system - questions, materials, pretest"
```
