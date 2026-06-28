import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import {
  dailyMixPlanSchema,
  tryMapAndRecoverMixPlan,
} from "@/server/ai/challenge";

describe("tryMapAndRecoverMixPlan", () => {
  const dummyInput = {
    userId: "user-1",
    userName: "Budi",
    grade: 11,
    school: "SMA 1",
    learningStyle: "TEXTUAL" as const,
    focusedSubjects: ["MATEMATIKA"],
    weakConcepts: [
      {
        id: "concept-1",
        name: "Trigonometri",
        masteryScore: 0.3,
        subjectName: "Matematika",
      },
    ],
    strongConcepts: [],
    recentChallenges: [],
    availableQuestions: [],
    mix: {
      questions: 0,
      materials: 1,
      reflections: 0,
    },
  };

  it("PASS: menerima material dengan content pendek (ga ada min 1500/300 lagi)", async () => {
    // Bug fix: content pendek ga ditolak lagi
    const rawJson = {
      title: "Tantangan Hari Ini",
      description: "Belajar Trigonometri.",
      reasoning: "Variasi latihan.",
      items: [
        {
          kind: "MATERIAL",
          subjectSlug: "MATEMATIKA",
          conceptHint: "Trigonometri",
          difficultyHint: "EASY",
          rationale: "Latihan.",
          material: {
            title: "Materi Trigonometri",
            content: "Pendahuluan singkat.", // Cuma 2 kata, dulu ditolak sekarang ga
            keyPoints: ["poin 1", "poin 2"],
            estimatedMinutes: 15,
            difficulty: "EASY",
          },
        },
      ],
    };

    const mapped = await tryMapAndRecoverMixPlan(rawJson, dummyInput);
    expect(mapped).not.toBeNull();
    if (!mapped) throw new Error("mapped is null");

    const parsed = dailyMixPlanSchema.parse(mapped);
    expect(parsed.items[0].material?.content).toBe("Pendahuluan singkat.");
  });
});
