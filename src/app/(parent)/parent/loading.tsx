import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="relative flex size-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--coral)]/20 opacity-75" />
        <span className="absolute inline-flex h-8 w-8 animate-spin rounded-full border-2 border-[var(--coral)] border-t-transparent" />
        <Loader2 className="relative size-5 animate-spin text-[var(--coral)]" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-sm font-bold text-foreground">
          Memuat dashboard orang tua...
        </p>
        <p className="text-xs text-muted-foreground">Tunggu sebentar ya.</p>
      </div>
    </div>
  );
}
