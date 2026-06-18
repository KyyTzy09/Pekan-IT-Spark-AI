"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

const MermaidRenderer = dynamic(() => import("./mermaid-renderer"), {
  ssr: false,
});

type MarkdownProps = ComponentProps<typeof Markdown>;

export function DocumentMarkdownText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "document-markdown space-y-3 text-[13.5px] leading-relaxed text-foreground",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {text}
      </Markdown>
    </div>
  );
}

const components: MarkdownProps["components"] = {
  h1: ({ children, ...props }) => (
    <h1
      className="font-heading text-[20px] font-bold leading-tight tracking-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="font-heading text-[18px] font-bold leading-snug" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="font-heading text-[16px] font-bold leading-snug" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="font-heading text-[14px] font-bold leading-snug" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="font-heading text-[13.5px] font-bold leading-snug"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="font-heading text-[13px] font-bold leading-snug" {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p className="leading-relaxed" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="list-disc space-y-1.5 pl-6 marker:text-[var(--coral)]/70"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal space-y-1.5 pl-6 marker:font-bold marker:text-[var(--coral)]/70"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-[var(--coral)] underline decoration-[var(--coral)]/40 underline-offset-2 hover:decoration-[var(--coral)]"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="rounded-r-xl border-l-4 border-[var(--coral)]/40 bg-[var(--coral)]/5 py-2 pl-4 pr-3 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className: codeClassName, ...props }) => {
    const isBlock = false;

    // Check if this is a Mermaid diagram code block
    if (codeClassName?.includes("language-mermaid")) {
      const codeString = String(children).replace(/\n$/, "");
      return <MermaidRenderer chart={codeString} />;
    }

    if (isBlock || codeClassName?.includes("language-")) {
      return (
        <code
          className={cn(
            "block overflow-x-auto rounded-xl bg-foreground/5 p-3 text-[12px]",
            codeClassName,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-foreground/8 px-1.5 py-0.5 font-mono text-[12.5px] text-[var(--coral)]"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="my-3 overflow-x-auto rounded-2xl border border-border/40 bg-foreground/5 p-4 text-[12.5px] leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-2xl border border-border/40 bg-background/60">
      <table className="w-full border-collapse text-[12.5px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-foreground/5" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b border-border/40 px-3 py-2 text-left font-bold"
      {...props}
    >
      {children}
    </th>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="even:bg-foreground/[0.02]" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-border/30 px-3 py-2 align-top" {...props}>
      {children}
    </td>
  ),
  hr: ({ ...props }) => (
    <hr className="my-4 border-0 border-t border-border/40" {...props} />
  ),
  img: ({ src, alt, ...props }) => (
    // biome-ignore lint/performance/noImgElement: markdown image source is dynamic
    <img
      src={src}
      alt={alt ?? ""}
      className="my-2 max-w-full rounded-xl border border-border/40"
      loading="lazy"
      {...props}
    />
  ),
};
