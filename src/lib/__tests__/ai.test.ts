import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { safeParseJson } from "@/lib/ai";

describe("safeParseJson", () => {
  it("parses valid JSON directly", () => {
    const result = safeParseJson('{"name": "test", "value": 42}');
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("parses JSON wrapped in ```json code block", () => {
    const result = safeParseJson('```json\n{"name": "test"}\n```');
    expect(result).toEqual({ name: "test" });
  });

  it("strips leading/trailing text around JSON", () => {
    const result = safeParseJson(
      'Here is the output:\n{"name": "test"}\nHope that helps!',
    );
    expect(result).toEqual({ name: "test" });
  });

  it("removes trailing commas", () => {
    const result = safeParseJson('{"name": "test", "items": [1, 2, 3,],}');
    expect(result).toEqual({ name: "test", items: [1, 2, 3] });
  });

  it("handles literal newlines inside JSON strings", () => {
    const input = '{"content": "line1\nline2\nline3"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe("line1\nline2\nline3");
  });

  it("handles literal tabs inside JSON strings", () => {
    const input = '{"content": "col1\tcol2"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe("col1\tcol2");
  });

  it("fixes invalid escape sequences like \\p, \\s, \\1", () => {
    const input =
      '{"contentMd": "Gunakan \\printf untuk output dan \\scanf untuk input"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.contentMd).toBe(
      "Gunakan \\printf untuk output dan \\scanf untuk input",
    );
  });

  it("fixes invalid escape \\s in markdown content", () => {
    const input =
      '{"content": "Regex: \\s matches whitespace, \\d matches digits"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe(
      "Regex: \\s matches whitespace, \\d matches digits",
    );
  });

  it("fixes invalid escape \\1 backreference", () => {
    const input = '{"content": "Use \\1 to reference first capture group"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe("Use \\1 to reference first capture group");
  });

  it("preserves valid escape sequences", () => {
    const input = '{"content": "line1\\nline2\\ttab\\\\"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe("line1\nline2\ttab\\");
  });

  it("handles mixed valid and invalid escapes", () => {
    const input = '{"content": "Use \\n for newline and \\printf for debug"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.content).toBe("Use \n for newline and \\printf for debug");
  });

  it("handles deeply nested JSON with invalid escapes", () => {
    const input = JSON.stringify({
      concepts: [
        {
          conceptName: "Pengenalan Pemrograman",
          contentMd: "Gunakan \\printf untuk mencetak teks ke layar",
          questions: [
            {
              questionText: "Apa fungsi dari \\printf?",
              options: ["Mencetak", "Membaca", "Menghapus", "Mengubah"],
              correctAnswer: "Mencetak",
            },
          ],
        },
      ],
    });
    const result = safeParseJson(input) as Record<string, unknown>;
    const concepts = result.concepts as Array<Record<string, unknown>>;
    expect(concepts[0].contentMd).toBe(
      "Gunakan \\printf untuk mencetak teks ke layar",
    );
  });

  it("handles Windows path separators \\U, \\C in content", () => {
    const input = '{"path": "File di \\Users\\Colorful\\Documents"}';
    const result = safeParseJson(input) as Record<string, unknown>;
    expect(result.path).toBe("File di \\Users\\Colorful\\Documents");
  });
});
