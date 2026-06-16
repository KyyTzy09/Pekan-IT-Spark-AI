import "server-only";

import mammoth from "mammoth";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { detectMarkdownTables, detectMathRegions } from "./content-check";

export type ExtractedDocument = {
  text: string;
  pageCount?: number;
  warnings: string[];
  mathRegions: Array<{
    start: number;
    end: number;
    latex: string;
    display: boolean;
  }>;
  tables: Array<{ start: number; end: number; rows: string[][] }>;
};

const MAX_TEXT_LENGTH = 200_000;

export class DocumentExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "EMPTY"
      | "ENCRYPTED"
      | "TOO_LARGE"
      | "UNSUPPORTED"
      | "CORRUPT",
  ) {
    super(message);
    this.name = "DocumentExtractionError";
  }
}

export async function extractFromPdf(
  buffer: Buffer,
): Promise<ExtractedDocument> {
  const warnings: string[] = [];
  let pageCount: number | undefined;
  let raw = "";
  let tableMarkdown = "";
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    raw = parsed.text ?? "";
    pageCount = parsed.total ?? undefined;
    try {
      const tables = await parser.getTable();
      if (tables.pages && tables.pages.length > 0) {
        for (const page of tables.pages) {
          for (const table of page.tables ?? []) {
            const rows = table as unknown as string[][];
            if (Array.isArray(rows) && rows.length > 0) {
              const header = rows[0] ?? [];
              const sep = header.map(() => "---");
              tableMarkdown +=
                "\n\n" +
                [header, sep, ...rows.slice(1)]
                  .map((r) => `| ${r.join(" | ")} |`)
                  .join("\n");
            }
          }
        }
        if (tableMarkdown.length > 0) {
          warnings.push(
            `Ditemukan tabel — sudah dikonversi ke Markdown biar Spark bisa baca.`,
          );
        }
      }
    } catch (e) {
      console.warn("pdf table extraction skipped:", e);
    }
  } catch (e) {
    console.error("[extractFromPdf] ERROR:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/password|encrypt/i.test(msg)) {
      throw new DocumentExtractionError(
        "PDF ini diproteksi password. Coba minta file tanpa password ya.",
        "ENCRYPTED",
      );
    }
    throw new DocumentExtractionError(
      "PDF tidak bisa dibaca. Pastikan file tidak corrupt. (Detail: " +
        msg +
        ")",
      "CORRUPT",
    );
  } finally {
    try {
      await parser.destroy();
    } catch {
      // ignore
    }
  }
  return finalize(raw + tableMarkdown, warnings, pageCount);
}

export async function extractFromDocx(
  buffer: Buffer,
): Promise<ExtractedDocument> {
  const warnings: string[] = [];
  let raw = "";
  try {
    const result = await mammoth.extractRawText({ buffer });
    raw = result.value ?? "";
    if (result.messages.length > 0) {
      for (const m of result.messages) {
        if (m.type === "warning") warnings.push(m.message);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new DocumentExtractionError(
      `DOCX tidak bisa dibaca (${msg}). Pastikan file tidak corrupt.`,
      "CORRUPT",
    );
  }
  return finalize(raw, warnings);
}

export function cleanTextToMarkdown(raw: string): string {
  return (
    raw
      .replace(/\r\n?/g, "\n")
      .replace(/[\t\f\v]+/g, " ")
      .replace(/ +\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: needed to strip out control characters
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]+/g, "")
      .split("\n")
      .map((line) => line.replace(/^ +/, "").replace(/ +$/, ""))
      .map((line) => {
        const headingMatch = line.match(/^([A-Z0-9][A-Z0-9 ,.'&:-]{4,})$/);
        if (headingMatch && line.length < 80) {
          return `## ${line}`;
        }
        return line;
      })
      .join("\n")
      .trim()
  );
}

function finalize(
  raw: string,
  warnings: string[],
  pageCount?: number,
): ExtractedDocument {
  const markdown = cleanTextToMarkdown(raw);
  if (markdown.length === 0) {
    throw new DocumentExtractionError(
      "Dokumen kosong atau tidak ada teks yang bisa diekstrak. Mungkin PDF hasil scan tanpa OCR.",
      "EMPTY",
    );
  }
  if (markdown.length > MAX_TEXT_LENGTH) {
    return {
      text: markdown.slice(0, MAX_TEXT_LENGTH),
      pageCount,
      warnings: [
        ...warnings,
        `Teks terpotong di ${MAX_TEXT_LENGTH.toLocaleString("id-ID")} karakter.`,
      ],
      mathRegions: detectMathRegions(markdown.slice(0, MAX_TEXT_LENGTH)),
      tables: detectMarkdownTables(markdown.slice(0, MAX_TEXT_LENGTH)),
    };
  }
  return {
    text: markdown,
    pageCount,
    warnings,
    mathRegions: detectMathRegions(markdown),
    tables: detectMarkdownTables(markdown),
  };
}
