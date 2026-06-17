"use client";

import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function UploadQuizGeneratorView({
  document,
}: {
  document: { id: string; originalName: string };
}) {
  const router = useRouter();
  const [count, setCount] = React.useState(5);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generate = React.useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const { generateDocumentQuizAction } = await import(
        "@/server/actions/documents"
      );
      const result = await generateDocumentQuizAction(document.id, count as 3 | 5 | 8);
      if (!result.ok) {
        setError(result.error);
        setIsGenerating(false);
        return;
      }
      router.push(`/upload/${document.id}/quiz/${result.quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setIsGenerating(false);
    }
  }, [count, document.id, router]);

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
              <span className="text-foreground">Buat latihan baru</span>
            </nav>
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)]">
                <GraduationCap size={18} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Bikin latihan soal
                </span>
                <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                  Latihan pilihan ganda
                </h1>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Spark bakal baca dokumen ini terus bikin soal pilihan ganda
                  adaptif sesuai level kamu.
                </p>
              </div>
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={60}>
        <div className="rounded-2xl border border-border/40 bg-card/85 p-5 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-7">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Jumlah soal
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[3, 5, 7, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    disabled={isGenerating}
                    className={`rounded-2xl border-2 px-4 py-3 text-center transition-all ${
                      count === n
                        ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)]"
                        : "border-border/40 bg-background/60 text-muted-foreground hover:border-[var(--coral)]/40"
                    }`}
                  >
                    <div className="font-heading text-[20px] font-bold leading-none">
                      {n}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">
                      Soal
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={isGenerating}
              size="lg"
              className="w-full rounded-full bg-[var(--coral)] text-white shadow-[0_8px_22px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Menyiapkan soal pilihan ganda...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-2" />
                  Generate {count} soal
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Butuh sekitar 10-30 detik. Kamu bakal otomatis dialih ke
              halamannya setelah selesai.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}