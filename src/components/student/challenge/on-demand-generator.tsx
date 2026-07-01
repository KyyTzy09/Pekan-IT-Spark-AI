"use client";

import {
  BookOpen,
  Loader2,
  MessageCircle,
  type Plus,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Kind = "QUESTION" | "MATERIAL" | "REFLECTION" | "MIX";

interface OnDemandGeneratorProps {
  onGenerate: (input: {
    kind?: Kind;
    subjectSlug?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
  }) => Promise<{ ok: boolean; challengeId?: string; error?: string }>;
  subjectOptions?: Array<{ slug: string; name: string }>;
}

const KIND_META: Record<
  Kind,
  { label: string; icon: typeof Plus; color: string; bg: string }
> = {
  MIX: {
    label: "Campuran",
    icon: Sparkles,
    color: "text-[var(--purple)]",
    bg: "bg-[var(--purple)]/10",
  },
  QUESTION: {
    label: "Soal aja",
    icon: Sparkles,
    color: "text-[var(--purple)]",
    bg: "bg-[var(--purple)]/10",
  },
  MATERIAL: {
    label: "Materi aja",
    icon: BookOpen,
    color: "text-[var(--teal)]",
    bg: "bg-[var(--teal)]/10",
  },
  REFLECTION: {
    label: "Refleksi aja",
    icon: MessageCircle,
    color: "text-[var(--coral)]",
    bg: "bg-[var(--coral)]/10",
  },
};

export function OnDemandGenerator({
  onGenerate,
  subjectOptions = [],
}: OnDemandGeneratorProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [kind, setKind] = React.useState<Kind>("MIX");
  const [subjectSlug, setSubjectSlug] = React.useState<string>("");
  const [difficulty, setDifficulty] = React.useState<
    "EASY" | "MEDIUM" | "HARD" | ""
  >("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await onGenerate({
      kind,
      subjectSlug: subjectSlug || undefined,
      difficulty: (difficulty || undefined) as
        | "EASY"
        | "MEDIUM"
        | "HARD"
        | undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Gagal generate");
      return;
    }
    if (res.challengeId) {
      window.location.href = `/challenge/${res.challengeId}`;
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-full bg-[var(--purple)] text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
      >
        <Wand2 size={14} strokeWidth={2.5} />
        Minta tantangan tambahan
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="on-demand-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => !submitting && setOpen(false)}
              className="absolute inset-0 -z-10 cursor-default bg-transparent border-none outline-none"
            />
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-border/40 bg-card shadow-[0_-12px_40px_rgba(80,20,50,0.18)] backdrop-blur-xl sm:rounded-3xl sm:shadow-[0_24px_60px_rgba(80,20,50,0.25)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.65 0.18 280 / 0.5), transparent 70%)",
                }}
              />

              <header className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                    Tantangan Tambahan
                  </p>
                  <h2
                    id="on-demand-title"
                    className="mt-1 font-heading text-[18px] font-bold leading-tight"
                  >
                    Mau tantangan apa hari ini? ✨
                  </h2>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Max 10x per hari. AI bakal bikin personal sesuai progress
                    kamu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  disabled={submitting}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-border/40 bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background disabled:opacity-40"
                  aria-label="Tutup"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </header>

              <div className="relative max-h-[60vh] space-y-4 overflow-y-auto p-5 sm:max-h-[480px]">
                <div>
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                    Tipe Tantangan
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(KIND_META) as Kind[]).map((k) => {
                      const meta = KIND_META[k];
                      const Icon = meta.icon;
                      const isActive = kind === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setKind(k)}
                          disabled={submitting}
                          className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-[12.5px] font-bold transition-all ${
                            isActive
                              ? "border-[var(--purple)]/40 bg-[var(--purple)]/8"
                              : "border-border/40 bg-background/60 hover:border-border"
                          }`}
                        >
                          <span
                            className={`grid size-7 place-items-center rounded-lg ${meta.bg} ${meta.color}`}
                          >
                            <Icon size={13} strokeWidth={2.5} />
                          </span>
                          <span className="truncate">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {subjectOptions.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                      Mapel (opsional)
                    </p>
                    <Select
                      value={subjectSlug || "__auto__"}
                      onValueChange={(val) =>
                        setSubjectSlug(val === "__auto__" ? "" : val)
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-10 w-full rounded-2xl border-border/40 bg-background/70 text-[13px]">
                        <SelectValue placeholder="Otomatis (pilih dari fokus kamu)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__auto__">
                          Otomatis (pilih dari fokus kamu)
                        </SelectItem>
                        {subjectOptions.map((s) => (
                          <SelectItem key={s.slug} value={s.slug}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                    Difficulty (opsional)
                  </p>
                  <div className="flex gap-1.5">
                    {(["", "EASY", "MEDIUM", "HARD"] as const).map((d) => {
                      const label =
                        d === ""
                          ? "Otomatis"
                          : d === "EASY"
                            ? "Dasar"
                            : d === "MEDIUM"
                              ? "Sedang"
                              : "Lanjut";
                      const isActive = difficulty === d;
                      return (
                        <button
                          key={d || "auto"}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          disabled={submitting}
                          className={`flex-1 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all ${
                            isActive
                              ? "border-[var(--coral)]/40 bg-[var(--coral)]/8 text-[var(--coral)]"
                              : "border-border/40 bg-background/60 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    {error}
                  </p>
                )}
              </div>

              <div className="relative flex items-center gap-2 border-t border-border/40 bg-background/40 p-3.5 backdrop-blur-sm">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-11 flex-1 rounded-full bg-[var(--purple)] font-bold text-white shadow-[0_6px_18px_rgba(124,58,237,0.35)] disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                        strokeWidth={2.5}
                      />
                      Spark lagi mikir…
                    </>
                  ) : (
                    <>
                      <Wand2 size={15} strokeWidth={2.5} />
                      Generate Tantangan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
