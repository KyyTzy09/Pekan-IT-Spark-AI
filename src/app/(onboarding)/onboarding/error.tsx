"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";

export default function OnboardingError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <SparkCharacter size="lg" />
      <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)]">
        <AlertTriangle size={24} strokeWidth={2.5} />
      </div>
      <h1 className="font-heading text-[22px] font-bold leading-tight">
        Ada yang error, nih
      </h1>
      <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        Maaf, Spark gagal ngambil data. Mungkin koneksi kamu lagi kurang stabil.
        Coba refresh aja dulu.
      </p>
      <Button
        onClick={reset}
        className="rounded-full bg-[var(--coral)] px-6 text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
      >
        <RefreshCw size={14} strokeWidth={2.5} />
        Coba lagi
      </Button>
    </div>
  );
}
