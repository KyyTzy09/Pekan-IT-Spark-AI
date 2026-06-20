import { Sparkles } from "lucide-react";

export function AiGeneratedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-[var(--purple)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--purple)] ${className}`}
      title="Item ini dibuat AI. Konfirmasi ke guru untuk hal-hal penting."
    >
      <Sparkles size={8} strokeWidth={2.5} />
      AI
    </span>
  );
}
