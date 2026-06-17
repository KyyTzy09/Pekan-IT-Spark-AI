import { Mail, Shield } from "lucide-react";

export function AuthTrustBadges() {
  return (
    <div className="mt-6 hidden items-center justify-center gap-4 rounded-2xl border border-border/40 bg-card/30 px-4 py-2.5 backdrop-blur-sm sm:flex">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Shield size={12} strokeWidth={2.5} className="text-[var(--teal)]" />
        Koneksi aman
      </span>
      <span className="h-3 w-px bg-border/60" aria-hidden />
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Mail size={12} strokeWidth={2.5} className="text-[var(--teal)]" />
        Tanpa spam
      </span>
    </div>
  );
}
