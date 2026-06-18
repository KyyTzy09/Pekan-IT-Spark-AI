"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function UploadMaterialGeneratorView({
  document,
}: {
  document: { id: string; originalName: string };
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [enhance, setEnhance] = React.useState(false);

  const generate = React.useCallback(
    async (useEnhance: boolean) => {
      setIsGenerating(true);
      setError(null);
      try {
        const { generateDocumentMaterialAction } = await import(
          "@/server/actions/documents"
        );
        const result = await generateDocumentMaterialAction(
          document.id,
          useEnhance,
        );
        if (!result.ok) {
          setError(result.error);
          setIsGenerating(false);
          return;
        }
        router.push(`/upload/${document.id}/material/${result.material.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal.");
        setIsGenerating(false);
      }
    },
    [document.id, router],
  );

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
              <span className="text-foreground">Buat materi baru</span>
            </nav>
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Bikin materi belajar
                </span>
                <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                  Materi belajar teori
                </h1>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Spark bakal baca dokumen ini terus bikin rangkuman teori yang
                  lengkap. Bisa kamu pakai buat belajar sebelum latihan.
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

          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/40 bg-background/60 p-4 transition-colors hover:border-[var(--teal)]/40">
              <input
                type="checkbox"
                checked={enhance}
                onChange={(e) => setEnhance(e.target.checked)}
                disabled={isGenerating}
                className="mt-1 size-4 accent-[var(--teal)]"
              />
              <div>
                <p className="font-heading text-[13.5px] font-bold">
                  Tingkatkan materi sebelumnya (lebih berbobot)
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Centang kalau kamu udah pernah bikin materi buat dokumen ini
                  dan mau Spark bikin versi yang lebih dalam.
                </p>
              </div>
            </label>

            <Button
              onClick={() => generate(enhance)}
              disabled={isGenerating}
              size="lg"
              className="w-full rounded-full bg-[var(--teal)] text-white shadow-[0_8px_22px_rgba(15,118,110,0.35)] hover:bg-[var(--teal)]/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Lagi merangkai materi...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-2" />
                  Generate materi belajar
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
