"use client";

import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  detectMathRegions,
  isLikelyTableLine,
} from "@/server/documents/content-check";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "math"; latex: string; display: boolean };

function splitTextWithMath(text: string): Segment[] {
  const regions = detectMathRegions(text);
  if (regions.length === 0) return [{ kind: "text", value: text }];
  const out: Segment[] = [];
  let cursor = 0;
  for (const r of regions) {
    if (r.start > cursor) {
      out.push({ kind: "text", value: text.slice(cursor, r.start) });
    }
    out.push({ kind: "math", latex: r.latex, display: r.display });
    cursor = r.end;
  }
  if (cursor < text.length) {
    out.push({ kind: "text", value: text.slice(cursor) });
  }
  return out;
}

function renderMath(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: display,
      strict: "ignore",
      output: "html",
    });
  } catch {
    return latex;
  }
}

function isTableLine(line: string): boolean {
  return isLikelyTableLine(line);
}

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; level: 2 | 3; text: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "code"; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.split(/\n/);
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (isTableLine(line)) {
      const next = lines[i + 1] ?? "";
      const sep = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(next.trim());
      if (sep) {
        const rows: string[][] = [];
        rows.push(parseTableRow(line));
        rows.push(parseTableRow(next));
        i += 2;
        while (i < lines.length && isTableLine(lines[i] ?? "")) {
          rows.push(parseTableRow(lines[i] ?? ""));
          i++;
        }
        out.push({ kind: "table", rows });
        continue;
      }
    }
    if (/^###\s+/.test(line)) {
      out.push({ kind: "h", level: 3, text: line.replace(/^###\s+/, "") });
    } else if (/^##\s+/.test(line)) {
      out.push({ kind: "h", level: 2, text: line.replace(/^##\s+/, "") });
    } else if (line.trim() === "") {
      // skip
    } else {
      out.push({ kind: "p", text: line });
    }
    i++;
  }
  return out;
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/\s*\|\s*/)
    .map((c) => c.trim());
}

function MathInline({ latex }: { latex: string }) {
  const html = useMemo(() => renderMath(latex, false), [latex]);
  return (
    <span
      // biome-ignore lint/security/noDangerouslySetInnerHtml: katex output is sanitized
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MathBlock({ latex }: { latex: string }) {
  const html = useMemo(() => renderMath(latex, true), [latex]);
  return (
    <div
      className="my-2 overflow-x-auto text-center"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: katex output is sanitized
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function InlineLine({ text }: { text: string }) {
  const segments = useMemo(() => splitTextWithMath(text), [text]);
  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.kind === "text") return <span key={idx}>{seg.value}</span>;
        if (seg.display) {
          return (
            <span key={idx} className="block">
              <MathBlock latex={seg.latex} />
            </span>
          );
        }
        return <MathInline key={idx} latex={seg.latex} />;
      })}
    </>
  );
}

function Table({ rows }: { rows: string[][] }) {
  if (rows.length < 2) return null;
  const header = rows[0] ?? [];
  const body = rows.slice(2);
  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-border/40 bg-background/60">
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="bg-foreground/5">
          <tr>
            {header.map((c, i) => (
              <th
                key={i}
                className="border-b border-border/40 px-3 py-2 text-left font-bold"
              >
                <InlineLine text={c} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="even:bg-foreground/[0.02]">
              {row.map((c, ci) => (
                <td
                  key={ci}
                  className="border-b border-border/30 px-3 py-2 align-top"
                >
                  <InlineLine text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentMarkdownText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return (
    <div className={cn("space-y-2 text-[13.5px] leading-relaxed", className)}>
      {blocks.map((b, i) => {
        if (b.kind === "h" && b.level === 2) {
          return (
            <h3
              key={i}
              className="font-heading text-[15px] font-bold leading-snug"
            >
              <InlineLine text={b.text} />
            </h3>
          );
        }
        if (b.kind === "h") {
          return (
            <h4
              key={i}
              className="font-heading text-[13.5px] font-bold leading-snug"
            >
              <InlineLine text={b.text} />
            </h4>
          );
        }
        if (b.kind === "table") {
          return <Table key={i} rows={b.rows} />;
        }
        if (b.kind === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl bg-foreground/5 p-3 text-[12px]"
            >
              <code>{b.text}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            <InlineLine text={b.text} />
          </p>
        );
      })}
    </div>
  );
}
