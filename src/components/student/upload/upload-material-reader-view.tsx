"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

type Material = {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
};

const difficultyLabel: Record<Material["difficulty"], string> = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
  ADVANCED: "Lanjut",
};

export function UploadMaterialReaderView({
  document,
  material,
}: {
  document: { id: string; originalName: string };
  material: Material;
}) {
  const router = useRouter();
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setError(null);
    try {
      const { generateDocumentMaterialAction } = await import(
        "@/server/actions/documents"
      );
      const result = await generateDocumentMaterialAction(document.id, true);
      if (!result.ok) {
        setError(result.error);
        setIsEnhancing(false);
        return;
      }
      router.push(`/upload/${document.id}/material/${result.material.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 175 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Link
                href="/upload"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft size={11} />
                Upload
              </Link>
              <ChevronRight size={11} />
              <Link
                href={`/upload/${document.id}`}
                className="truncate transition-colors hover:text-foreground"
              >
                {document.originalName}
              </Link>
              <ChevronRight size={11} />
              <span className="text-foreground">Materi</span>
            </nav>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                  <BookOpen size={18} />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                    <BookOpen size={10} strokeWidth={2.5} />
                    Materi Belajar AI
                  </span>
                  <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                    {material.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                      Level: {difficultyLabel[material.difficulty]}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                      ~{material.estimatedMinutes} menit baca
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Sparkles size={12} className="mr-1" />
                  {isEnhancing ? "Lagi upgrade..." : "Tingkatkan (Lebih Berbobot)"}
                </Button>
                <Button asChild size="sm" className="rounded-full bg-[var(--teal)] text-white">
                  <Link href={`/upload/${document.id}?tab=materials`}>
                    Selesai Membaca
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
      </Reveal>

      {error && (
        <div className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <Reveal delay={60}>
        <article className="rounded-2xl border border-border/40 bg-card/85 p-5 shadow-[0_8px_22px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-7">
          <section>
            <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
              Poin Kunci
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {material.keyPoints.map((kp) => (
                <li
                  key={kp}
                  className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-[12.5px]"
                >
                  <CheckCircle2
                    size={13}
                    className="mt-0.5 shrink-0 text-[var(--teal)]"
                  />
                  <span>{kp}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr className="my-6 border-border/40" />

          <section>
            <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
              Isi Materi
            </h2>
            <div className="mt-3">
              <DocumentMarkdownText text={material.content} />
            </div>
          </section>
        </article>
      </Reveal>
    </div>
  );
}