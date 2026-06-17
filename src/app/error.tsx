"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-destructive/30 bg-card/80 p-6 text-center shadow-lg backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-[var(--coral)]/15 opacity-50 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-lg">
            <AlertTriangle size={20} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              Terjadi Kesalahan
            </p>
            <h1 className="mt-1 font-heading text-[20px] font-bold leading-tight text-foreground">
              Terjadi Kesalahan
            </h1>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Coba refresh dulu, atau kembali ke beranda.
            </p>
            {error.digest && (
              <code className="mt-2 inline-block rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {error.digest}
              </code>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={reset}
              className="rounded-full bg-[var(--coral)] text-white shadow-lg"
            >
              <RefreshCw size={13} strokeWidth={2.5} /> Coba lagi
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/">
                <Home size={13} /> Beranda
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
