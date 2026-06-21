"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Reset state on chart change
    setSvgContent("");
    setError(null);
    setIsRendering(true);

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          themeVariables: {
            background: "transparent",
            primaryColor: "rgba(239, 68, 68, 0.1)",
            primaryTextColor: "#e4e4e7",
            lineColor: "#3f3f46",
            tertiaryColor: "rgba(239, 68, 68, 0.05)",
          },
        });

        // Generate unique id for the svg
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const cleanChart = preprocessChart(chart.trim());

        // Render the diagram
        const { svg } = await mermaid.render(id, cleanChart);

        if (isMounted) {
          setSvgContent(svg);
          setIsRendering(false);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to render diagram";
          setError(errorMessage);
          setIsRendering(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Inject SVG content when available and component finished rendering the target div
  useEffect(() => {
    if (svgContent && containerRef.current) {
      containerRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  if (isRendering) {
    return (
      <div className="my-4 flex flex-col items-center justify-center p-6 border border-dashed border-border/40 rounded-xl bg-card/30 min-h-[150px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
        <span className="text-xs text-muted-foreground">
          Menyiapkan diagram visual...
        </span>
      </div>
    );
  }

  if (error) {
    // Fallback: show the original code block so it doesn't break the user experience
    return (
      <div className="my-4 w-full">
        <div className="text-[11px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-t-xl font-medium">
          ⚠️ Gagal merender visualisasi. Menampilkan kode sumber diagram:
        </div>
        <pre className="overflow-x-auto rounded-b-xl border border-t-0 border-border/40 bg-foreground/5 p-4 text-[12px] font-mono leading-relaxed">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4 flex flex-col items-center justify-center border border-border/40 rounded-2xl bg-card/65 backdrop-blur-sm p-5 shadow-sm overflow-hidden w-full">
      <div className="w-full text-center mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        📊 Visualisasi Konsep (Mermaid)
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-x-auto flex justify-center mermaid-render-output"
      />
    </div>
  );
}

function preprocessChart(chart: string): string {
  let processed = chart;

  // Connector prefix regex pattern that optionally allows connector text like -->|text|
  const prefix =
    "(?:^\\s*|-[.-]+>\\s*|={2,}>\\s*|-{3,}\\s*|-\\.-+\\s*)(?:\\|[^|]+\\|\\s*)?";

  // 1. Stadium shape: A([Text]) -> A(["Text"])
  // Run this first to avoid matching ([...]) in the box pattern
  processed = processed.replace(
    new RegExp(
      `${prefix}\\b([a-zA-Z0-9_-]+)\\s*\\(\\s*\\[(?!["'\\s])([^\\]]+)\\]\\s*\\)`,
      "gm",
    ),
    (match, id, text) => {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return match;
      }
      const matchPrefix = match.substring(0, match.indexOf(id));
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${matchPrefix}${id}(["${escaped}"])`;
    },
  );

  // 2. Box shape: A[Text] -> A["Text"]
  processed = processed.replace(
    new RegExp(
      `${prefix}\\b([a-zA-Z0-9_-]+)\\s*\\[(?!["'/\\s\\\\])([^\\]]+)\\]`,
      "gm",
    ),
    (match, id, text) => {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return match;
      }
      const matchPrefix = match.substring(0, match.indexOf(id));
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${matchPrefix}${id}["${escaped}"]`;
    },
  );

  // 3. Hexagon shape: A{{Text}} -> A{{"Text"}}
  processed = processed.replace(
    new RegExp(
      `${prefix}\\b([a-zA-Z0-9_-]+)\\s*\\{\\{(?!["'\\s])([^}]+)\\}\\}`,
      "gm",
    ),
    (match, id, text) => {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return match;
      }
      const matchPrefix = match.substring(0, match.indexOf(id));
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${matchPrefix}${id}{{"${escaped}"}}`;
    },
  );

  // 4. Rhombus/Decision shape: A{Text} -> A{"Text"}
  processed = processed.replace(
    new RegExp(
      `${prefix}\\b([a-zA-Z0-9_-]+)\\s*\\{(?!["'\\s])([^}]+)\\}`,
      "gm",
    ),
    (match, id, text) => {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return match;
      }
      const matchPrefix = match.substring(0, match.indexOf(id));
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${matchPrefix}${id}{"${escaped}"}`;
    },
  );

  // 5. Round shape: A(Text) -> A("Text")
  processed = processed.replace(
    new RegExp(
      `${prefix}\\b([a-zA-Z0-9_-]+)\\s*\\((?!["'\\s])([^)]+)\\)`,
      "gm",
    ),
    (match, id, text) => {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return match;
      }
      const matchPrefix = match.substring(0, match.indexOf(id));
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${matchPrefix}${id}("${escaped}")`;
    },
  );

  return processed;
}
