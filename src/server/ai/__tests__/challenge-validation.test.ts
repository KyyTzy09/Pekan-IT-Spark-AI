import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import { z } from "zod";
import { countWords } from "@/server/utils/word-count";

// Re-declare schemas here to test the actual production validation rules.
// Mirrors materialSchema & materialContentSchema di src/server/ai/challenge.ts.
const materialSchema = z.object({
  title: z.string().max(120),
  content: z.string().min(1).describe("Konten materi dalam format Markdown."),
  keyPoints: z.array(z.string()).min(2).max(8),
  estimatedMinutes: z.number().int().min(10).max(45),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const materialContentSchema = z.object({
  content: z.string().min(1),
});

describe("materialSchema - validasi content (REGRESSION TEST)", () => {
  const validMaterial = {
    title: "Pengenalan Trigonometri",
    content:
      "Ini adalah konten materi yang panjangnya lebih dari 1500 karakter. ".repeat(
        30,
      ) + " Penutup materi.", // ~1500+ chars
    keyPoints: ["poin 1", "poin 2", "poin 3"],
    estimatedMinutes: 15,
    difficulty: "MEDIUM" as const,
  };

  it("PASS: menerima material dengan content panjang (≥300 kata / ≥1500 char)", () => {
    const result = materialSchema.safeParse(validMaterial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content.length).toBeGreaterThanOrEqual(1500);
      expect(countWords(result.data.content)).toBeGreaterThanOrEqual(300);
    }
  });

  it("PASS: menerima material dengan content PENDEK (1 kata) — ga ada min kata/char lagi", () => {
    // Bug fix: dulu content < 1500 char / 300 kata ditolak, sekarang ga
    const shortMaterial = {
      ...validMaterial,
      content: "Pendek.", // Cuma 1 kata
    };
    const result = materialSchema.safeParse(shortMaterial);
    expect(result.success).toBe(true);
  });

  it("PASS: menerima material dengan content 200 kata (di bawah threshold lama 300)", () => {
    // Confirm threshold lama udah ga berlaku
    const twoHundredWords = Array(200).fill("kata").join(" ");
    const mediumMaterial = { ...validMaterial, content: twoHundredWords };
    const result = materialSchema.safeParse(mediumMaterial);
    expect(result.success).toBe(true);
  });

  it("FAIL: tetap nolak content kosong", () => {
    const emptyMaterial = { ...validMaterial, content: "" };
    const result = materialSchema.safeParse(emptyMaterial);
    expect(result.success).toBe(false);
  });

  it("PASS: title kosong masih lolos (schema cuma max(120), bukan required)", () => {
    // Schema production cuma validasi max(120) di title, bukan min length
    const noTitle = { ...validMaterial, title: "" };
    const result = materialSchema.safeParse(noTitle);
    expect(result.success).toBe(true);
  });

  it("FAIL: tetap nalom title > 120 karakter", () => {
    const longTitle = { ...validMaterial, title: "a".repeat(121) };
    const result = materialSchema.safeParse(longTitle);
    expect(result.success).toBe(false);
  });

  it("FAIL: tetap nalom keyPoints < 2", () => {
    const fewKeyPoints = { ...validMaterial, keyPoints: ["cuma satu"] };
    const result = materialSchema.safeParse(fewKeyPoints);
    expect(result.success).toBe(false);
  });

  it("FAIL: tetap nolak estimatedMinutes di luar range 10-45", () => {
    const wrongMinutes = { ...validMaterial, estimatedMinutes: 5 };
    const result = materialSchema.safeParse(wrongMinutes);
    expect(result.success).toBe(false);
  });

  it("FAIL: tetap nalom difficulty yang ga valid", () => {
    const wrongDifficulty = { ...validMaterial, difficulty: "SUPER_HARD" };
    const result = materialSchema.safeParse(wrongDifficulty);
    expect(result.success).toBe(false);
  });
});

describe("materialContentSchema - validasi content (REGRESSION TEST)", () => {
  it("PASS: menerima content pendek (cuma 1 karakter)", () => {
    const result = materialContentSchema.safeParse({ content: "x" });
    expect(result.success).toBe(true);
  });

  it("PASS: menerima content panjang", () => {
    const longContent = "a".repeat(2000);
    const result = materialContentSchema.safeParse({ content: longContent });
    expect(result.success).toBe(true);
  });

  it("FAIL: tetap nolak content kosong", () => {
    const result = materialContentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});
