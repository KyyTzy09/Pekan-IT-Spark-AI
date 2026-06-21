import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import {
  dailyMixPlanSchema,
  tryMapAndRecoverMixPlan,
} from "@/server/ai/challenge";
import { countWords } from "@/server/utils/word-count";

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

  it("discards invalid material generated inline and falls back to a valid full-length material", async () => {
    // LLM generated plan containing a material that is too short
    const rawJson = {
      title: "Tantangan Hari Ini",
      description: "Belajar Trigonometri Dasar.",
      reasoning: "Membantu memperkuat konsep lemah.",
      items: [
        {
          kind: "MATERIAL",
          subjectSlug: "MATEMATIKA",
          conceptHint: "Trigonometri",
          difficultyHint: "EASY",
          rationale: "Pengenalan materi dasar.",
          material: {
            title: "Materi Trigonometri Singkat",
            content: "", // Too short (violates min 10)
            keyPoints: [], // Too few key points (violates min 1)
            estimatedMinutes: -5, // Too short time (violates min 1)
            difficulty: "EASY",
          },
        },
      ],
    };

    const mapped = await tryMapAndRecoverMixPlan(rawJson, dummyInput);
    expect(mapped).not.toBeNull();
    if (!mapped) throw new Error("mapped is null");

    const material = mapped.items[0].material;
    const parsed = dailyMixPlanSchema.parse(mapped);
    expect(parsed.items[0].kind).toBe("MATERIAL");

    expect(material).toBeDefined();
    expect(material?.title).toContain("Trigonometri");
    expect(material?.keyPoints?.length).toBeGreaterThanOrEqual(3);
    expect(material?.estimatedMinutes).toBeGreaterThanOrEqual(10);
    expect(material?.content?.length).toBeGreaterThanOrEqual(1500);
    expect(countWords(material?.content || "")).toBeGreaterThanOrEqual(300);
  });
});
