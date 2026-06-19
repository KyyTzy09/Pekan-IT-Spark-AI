import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

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
    expect(instructions).toContain("Studi kasus");
  });
});
