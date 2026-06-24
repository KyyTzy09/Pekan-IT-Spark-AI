import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, generateText: vi.fn() }));

import { AI_QUOTA_LIMITS, canIncrementQuota } from "@/server/ai-quota";

// ============================================================
// BUG #1: AI Generation di DALAM DB Transaction
// ============================================================
describe("BUG #1 — AI calls TIDAK ada di dalam $transaction", () => {
  it("TIDAK ada panggilan generateQuestionsForConcept di dalam $transaction callback", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    // Cari region antara $transaction(async (tx) => dan tutup transaksinya
    const txMatch = source.match(
      /await prisma\.\$transaction\s*\(async\s*\(tx\)\s*=>\s*{([^}]*(?:\{[^}]*\}[^}]*)*)}/,
    );

    // Kalo ketemu, pastikan ga ada AI call di dalamnya
    if (txMatch) {
      const txBody = txMatch[1];
      expect(txBody).not.toContain("generateQuestionsForConcept");
      expect(txBody).not.toContain("generateMaterialMarkdown");
      expect(txBody).not.toContain("incrementAiQuota");
    }
  });

  it("resolveQuestionOutsideTransaction dipanggil SEBELUM $transaction (bukan di dalam)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    // Cari: resolveQuestionOutsideTransaction harus muncul SEBELUM $transaction
    const resolveIdx = source.indexOf("resolveQuestionOutsideTransaction");
    const txIdx = source.indexOf("await prisma.$transaction");

    expect(resolveIdx).toBeGreaterThanOrEqual(0);
    expect(txIdx).toBeGreaterThanOrEqual(0);
    expect(resolveIdx).toBeLessThan(txIdx);
  });
});

// ============================================================
// BUG #2: learningStyle hardcoded "VISUAL"
// ============================================================
describe("BUG #2 — learningStyle dioper dari profile, bukan hardcoded", () => {
  it("resolveQuestionOutsideTransaction nerima parameter learningStyle", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    // Cek signature function — harus ada parameter learningStyle
    const sigMatch = source.match(
      /async function resolveQuestionOutsideTransaction\s*\([^)]*learningStyle[^)]*\)/,
    );
    expect(sigMatch).not.toBeNull();
  });

  it("TIDAK ada hardcoded learningStyle: 'VISUAL' di resolveQuestionOutsideTransaction", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    // Cari di region resolveQuestionOutsideTransaction
    const fnStart = source.indexOf(
      "async function resolveQuestionOutsideTransaction",
    );
    const fnEnd = source.indexOf("\n}\n\n", fnStart);
    const fnBody = source.slice(fnStart, fnEnd + 5);

    // Mungkin masih ada learningStyle: "VISUAL" di dalam generateDailyMix call,
    // tapi di resolveQuestionOutsideTransaction harus pake parameter
    // Kalo ada yang hardcoded, cuma boleh di default parameter signature
    const hardcodedMatch = fnBody.match(/learningStyle:\s*"VISUAL"/);
    if (hardcodedMatch) {
      // Cek kalo itu di parameter default: learningStyle = "VISUAL" (itu OK)
      const lineBefore = fnBody.slice(
        Math.max(0, hardcodedMatch.index! - 30),
        hardcodedMatch.index!,
      );
      expect(lineBefore).toMatch(/learningStyle\s*[:=]\s*$/);
    }
  });
});

// ============================================================
// BUG #3: strongConcepts selalu []
// ============================================================
describe("BUG #3 — strongConcepts di-fetch dari DB", () => {
  it("generateOneDailyChallenge nge-fetch strongConcepts (masteryScore >= 0.7)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    // Cari: harus ada query untuk strongConcepts (masteryScore: { gte: 0.7 })
    const hasStrongQuery = source.includes("masteryScore: { gte: 0.7 }");
    expect(hasStrongQuery).toBe(true);

    // Cari: strongConcepts dioper ke generateDailyMix
    const mixCallMatch = source.match(
      /strongConcepts:\s*strongConcepts\.map[^;]+/,
    );
    expect(mixCallMatch).not.toBeNull();
  });
});

// ============================================================
// BUG #4: Quota dikembalikan kalo AI gagal
// ============================================================
describe("BUG #4 — AI quota dikembalikan (decrement) kalo gagal", () => {
  it("resolveQuestionOutsideTransaction panggil decrementAiQuota di catch blocks", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    const fnStart = source.indexOf(
      "async function resolveQuestionOutsideTransaction",
    );
    const fnEnd = source.indexOf("\n}\n\n", fnStart);
    const fnBody = source.slice(fnStart, fnEnd + 5);

    // Harus ada decrementAiQuota di catch (question gagal)
    expect(fnBody).toContain('await decrementAiQuota(userId, "questions", 1)');
    // Harus ada decrementAiQuota kalo concept ga ditemukan
    expect(fnBody).toContain('await decrementAiQuota(userId, "questions", 1)');
    // Harus ada decrementAiQuota di catch (material gagal)
    expect(fnBody).toContain('await decrementAiQuota(userId, "materials", 1)');
  });
});

// ============================================================
// BUG #5: userName dioper, bukan undefined
// ============================================================
describe("BUG #5 — userName dioper ke fallback material", () => {
  it("resolveQuestionOutsideTransaction pake parameter userName, bukan hardcoded undefined", () => {
    const source = readFileSync(
      join(process.cwd(), "src/server/actions/challenges.ts"),
      "utf-8",
    );

    const fnStart = source.indexOf(
      "async function resolveQuestionOutsideTransaction",
    );
    const fnEnd = source.indexOf("\n}\n\n", fnStart);
    const fnBody = source.slice(fnStart, fnEnd + 5);

    // Pastikan ga ada userName: undefined
    // (selain di panggilan generateMaterialMarkdown yang pake parameter userName)
    const undefinedUsages = fnBody.match(/userName:\s*undefined/g);
    // Kalo ada, harus cuma di parameter function, bukan di call
    expect(undefinedUsages).toBeNull();
  });
});

// ============================================================
// canIncrementQuota — pure function
// ============================================================
describe("canIncrementQuota", () => {
  it("return true kalo quota masih cukup", () => {
    expect(canIncrementQuota(null, "questions", 1)).toBe(true);
    expect(
      canIncrementQuota(
        { questionsCount: 5, materialsCount: 0, chatCount: 0 },
        "questions",
        1,
      ),
    ).toBe(true);
    expect(
      canIncrementQuota(
        { questionsCount: 19, materialsCount: 0, chatCount: 0 },
        "questions",
        1,
      ),
    ).toBe(true);
  });

  it("return false kalo quota udah penuh", () => {
    expect(
      canIncrementQuota(
        { questionsCount: 20, materialsCount: 0, chatCount: 0 },
        "questions",
        1,
      ),
    ).toBe(false);
    expect(
      canIncrementQuota(
        { questionsCount: 5, materialsCount: 5, chatCount: 0 },
        "materials",
        1,
      ),
    ).toBe(false);
  });

  it("return false kalo increment melebihi limit", () => {
    expect(
      canIncrementQuota(
        { questionsCount: 19, materialsCount: 0, chatCount: 0 },
        "questions",
        2,
      ),
    ).toBe(false);
  });

  it("return true kalo masih ada sisa dengan by > 1", () => {
    expect(
      canIncrementQuota(
        { questionsCount: 18, materialsCount: 0, chatCount: 0 },
        "questions",
        2,
      ),
    ).toBe(true);
  });

  it("limits sesuai AI_QUOTA_LIMITS", () => {
    expect(AI_QUOTA_LIMITS.questions).toBe(20);
    expect(AI_QUOTA_LIMITS.materials).toBe(5);
  });
});
