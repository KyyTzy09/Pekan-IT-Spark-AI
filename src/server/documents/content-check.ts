const LATEX_INLINE = /\\\((.+?)\\\)|\$([^$\n]+?)\$/g;
const LATEX_DISPLAY = /\\\[(.+?)\\\]|\$\$([^$]+?)\$\$/g;
const LATEX_ENV =
  /\\begin\{(equation|align|gather|multline|cases|matrix|pmatrix|bmatrix|array)\*?\}([\s\S]+?)\\end\{\1\*?\}/g;
const LATEX_CMDS = /(?:\\[a-zA-Z]+\b)|(?:[_^]\s*[a-zA-Z0-9])/;

const TABLE_ROW_SPLIT = /\r?\n/;
const TABLE_CELL_SPLIT = /\s*\|\s*/;

export function detectMathRegions(text: string): Array<{
  start: number;
  end: number;
  latex: string;
  display: boolean;
}> {
  const matches: Array<{
    start: number;
    end: number;
    latex: string;
    display: boolean;
  }> = [];
  const seen = new Set<number>();
  const register = (m: RegExpExecArray, display: boolean) => {
    const start = m.index;
    if (seen.has(start)) return;
    seen.add(start);
    const latex = (m[1] ?? m[2] ?? "").trim();
    if (latex.length < 2) return;
    if (!LATEX_CMDS.test(latex) && !/[\d=+\-*/^_{}()]/.test(latex)) return;
    matches.push({ start, end: start + m[0].length, latex, display });
  };
  for (const m of text.matchAll(LATEX_ENV)) register(m, true);
  for (const m of text.matchAll(LATEX_DISPLAY)) register(m, true);
  for (const m of text.matchAll(LATEX_INLINE)) register(m, false);
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export function isLikelyTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  const cells = trimmed.slice(1, -1).split(TABLE_CELL_SPLIT);
  return cells.length >= 2 && cells.every((c) => c.length > 0);
}

export function detectMarkdownTables(
  text: string,
): Array<{ start: number; end: number; rows: string[][] }> {
  const lines = text.split(TABLE_ROW_SPLIT);
  const tables: Array<{ start: number; end: number; rows: string[][] }> = [];
  let i = 0;
  let cursor = 0;
  while (i < lines.length) {
    if (isLikelyTableLine(lines[i] ?? "")) {
      const nextLine = lines[i + 1] ?? "";
      const isSeparator = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(
        nextLine.trim(),
      );
      if (isSeparator) {
        const start = cursor + (lines[i]?.length ?? 0) + 1;
        const rows: string[][] = [parseRow(lines[i] ?? "")];
        rows.push(parseRow(nextLine));
        let j = i + 2;
        while (j < lines.length && isLikelyTableLine(lines[j] ?? "")) {
          rows.push(parseRow(lines[j] ?? ""));
          j++;
        }
        const end =
          cursor +
          lines.slice(0, j).join("\n").length +
          (j > 0 ? (lines[j - 1]?.length ?? 0) : 0);
        tables.push({ start, end, rows });
        cursor = end + 1;
        i = j;
        continue;
      }
    }
    cursor += (lines[i]?.length ?? 0) + 1;
    i++;
  }
  return tables;
}

function parseRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(TABLE_CELL_SPLIT)
    .map((c) => c.trim());
}

export type ContentWarning = {
  kind: "low_text" | "low_alpha_ratio" | "off_topic_signal" | "too_long";
  message: string;
};

const OFF_TOPIC_SIGNALS: Array<{ re: RegExp; label: string }> = [
  {
    re: /\b(adult\s*content|nsfw|explicit\s*sexual|porn(?:ography)?|18\+|xxx)\b/i,
    label: "konten dewasa",
  },
  {
    // BUG-5 FIX: Expanded pattern to catch common obfuscations
    re: /\b(?:p[o0]rn[o0]?|p[e3]d[o0]|s[e3]x\s*(?:vid|tub|chat|cam)|b[o0]k[e3]p|n[uud]+[d3]+[e3]|f[a4]p|orgas[mn])\b/i,
    label: "konten dewasa",
  },
  {
    re: /\b(weapon\s*synthesis|synthesize\s*meth|cocaine|heroin|fentanyl|how\s*to\s*make\s*a?\s*bomb|build\s*a?\s*bomb|terroris)\b/i,
    label: "konten berbahaya",
  },
  {
    // BUG-5 FIX: Expanded harmful content patterns
    re: /\b(?:m[e3]t[h4]|f[e3]nt[a4]nyl|c[o0]c[a4]in[e3]|h[e3]r[o0]in|e?xpl[o0]s[i1]v[e3]|w[e3]ap[o0]n\s*(?:mak|build|synth))\b/i,
    label: "konten berbahaya",
  },
  {
    re: /\b(hate\s*speech|genocide|kill\s*all|supremacist)\b/i,
    label: "ujaran kebencian",
  },
  {
    // BUG-5 FIX: Indonesian harmful content patterns
    re: /\b(?:konten\s*dewasa|video\s*bokep|foto\s*bugil|judi\s*online|narkoba|bahan\s*peledak)\b/i,
    label: "konten terlarang",
  },
];

const MIN_TEXT_LENGTH = 80;
const MIN_ALPHA_RATIO = 0.4;

export function validateEducationalContent(
  text: string,
): { ok: true; warnings: ContentWarning[] } | { ok: false; reason: string } {
  if (text.length < MIN_TEXT_LENGTH) {
    return {
      ok: false,
      reason:
        "Teks terlalu sedikit (< 80 karakter). Pastikan file ga kosong atau hasil scan yang belum di-OCR.",
    };
  }
  const letters = text.match(/[A-Za-z\u00C0-\u024F]/g)?.length ?? 0;
  if (letters / text.length < MIN_ALPHA_RATIO) {
    return {
      ok: false,
      reason:
        "Dokumen ini sepertinya hasil scan/foto tanpa OCR — tolong upload file yg udah searchable, atau pake fitur OCR dulu.",
    };
  }
  for (const { re, label } of OFF_TOPIC_SIGNALS) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: `Dokumen terdeteksi mengandung ${label}. Spark cuma untuk materi edukasi ya.`,
      };
    }
  }

  // BUG-5 FIX: Check for zero-width character injection (common bypass technique)
  const zeroWidthChars = /\u200B|\u200C|\u200D|\uFEFF|\u2060|\u00AD/g;
  const cleaned = text.replace(zeroWidthChars, "");
  for (const { re, label } of OFF_TOPIC_SIGNALS) {
    if (re.test(cleaned)) {
      return {
        ok: false,
        reason: `Dokumen terdeteksi mengandung ${label} (dengan karakter tersembunyi). Spark cuma untuk materi edukasi ya.`,
      };
    }
  }

  return { ok: true, warnings: [] };
}
