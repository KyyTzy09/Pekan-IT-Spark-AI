"use client";

import * as React from "react";
import { Loader2, Search, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateCustomSubjectPretest } from "@/server/actions/generate-onboarding-pretest";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export type GeneratedPretestResult = {
  ok: true;
  questions: Array<{
    topicIndex: number;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
  }>;
  subjectData: {
    name: string;
    icon: string;
    color: string;
    description: string;
    topics: Array<{
      name: string;
      description: string;
      concepts: Array<{ name: string; description: string }>;
    }>;
  };
};

export function SubjectSearchDialog({
  open,
  onClose,
  subjects,
  selectedSubjects,
  onToggleSubject,
  onCustomSubjectCreated,
  educationLevel,
  grade,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  selectedSubjects: string[];
  onToggleSubject: (id: string) => void;
  onCustomSubjectCreated: (result: GeneratedPretestResult) => void;
  educationLevel: string;
  grade: number;
}) {
  const [query, setQuery] = React.useState("");
  const [customName, setCustomName] = React.useState("");
  const [customContext, setCustomContext] = React.useState("");
  const [showCustomForm, setShowCustomForm] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = query
    ? subjects.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : subjects;

  const handleGenerate = async () => {
    if (customName.trim().length < 2) {
      setError("Nama mapel minimal 2 karakter");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateCustomSubjectPretest({
        name: customName.trim(),
        context: customContext.trim() || undefined,
        educationLevel: educationLevel as "SMA" | "SMK",
        grade,
      });
      if (!result.ok) {
        setError(result.error ?? "Gagal generate. Coba lagi.");
        setIsGenerating(false);
        return;
      }
      onCustomSubjectCreated(result);
      handleClose();
    } catch (err) {
      console.error("[ONBOARDING_SERVICE] generateCustomSubjectPretest error:", err);
      setError("Gagal terhubung ke AI. Coba lagi.");
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    setQuery("");
    setCustomName("");
    setCustomContext("");
    setShowCustomForm(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => { if (isGenerating) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isGenerating) e.preventDefault(); }}
        className="max-w-lg p-0 overflow-hidden bg-card border border-border/40"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
          }}
        />

        <DialogHeader className="relative flex-row items-start justify-between gap-3 border-border/40 border-b p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
              Tambah mapel
            </p>
            <DialogTitle className="mt-1 font-heading text-[20px] font-bold leading-tight">
              {showCustomForm ? "Bikin mapel kustom" : "Cari mapel"}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border/40 bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background disabled:opacity-40"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </DialogHeader>

        <div className="relative max-h-[60vh] overflow-y-auto p-5 sm:max-h-[480px]">
          {!showCustomForm ? (
            <div className="space-y-3">
              <div className="group/field relative flex items-center rounded-2xl border border-border/40 bg-background/60 transition-colors focus-within:border-[var(--coral)]/40 focus-within:ring-2 focus-within:ring-[var(--coral)]/15">
                <span className="grid size-10 place-items-center text-muted-foreground">
                  <Search size={15} />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari mapel nasional..."
                  className="h-11 w-full min-w-0 rounded-2xl bg-transparent pr-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {filtered.map((s) => {
                  const active = selectedSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onToggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                        active
                          ? "border-[var(--coral)]/40 bg-[var(--coral)]/8 ring-1 ring-[var(--coral)]/30"
                          : "border-border/30 bg-background/40 hover:border-border/60",
                      )}
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-white"
                        style={{
                          background: s.color
                            ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                            : "linear-gradient(135deg, var(--coral), var(--orange))",
                        }}
                      >
                        <span className="text-[14px]">{s.icon ?? "📚"}</span>
                      </span>
                      <span className="text-[12px] font-semibold text-foreground">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border/30 pt-3">
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Mapel kamu tidak ada di daftar?
                </p>
                <Button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="h-10 w-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--pink)] text-white font-bold shadow-[0_6px_18px_rgba(139,92,246,0.3)]"
                >
                  <Wand2 size={14} strokeWidth={2.5} />
                  Bikin mapel custom + AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/5 p-3.5 text-[12px] leading-relaxed text-foreground/80">
                <p className="font-bold text-[var(--purple)]">🪄 Spark AI bakal:</p>
                <ul className="mt-1.5 space-y-1 pl-4">
                  <li>• Bikin 3-6 topik sesuai mapel kamu</li>
                  <li>• Generate 3-6 konsep per topik</li>
                  <li>• Bikin 5-8 soal pretest untuk ukur kemampuan awal</li>
                </ul>
              </div>

              <div>
                <label
                  htmlFor="search-subject-name"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Nama mapel
                </label>
                <input
                  id="search-subject-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="cth: Bahasa Jawa, Coding, Musik…"
                  maxLength={60}
                  disabled={isGenerating}
                  className="mt-1.5 h-11 w-full rounded-2xl border border-border/50 bg-background/70 px-4 text-[14px] font-semibold backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/15 disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="search-subject-context"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Konteks tambahan (opsional)
                  </label>
                </div>
                <textarea
                  id="search-subject-context"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Boleh kosong. Kasih tau Spark fokus yang kamu mau."
                  maxLength={280}
                  rows={2}
                  disabled={isGenerating}
                  className="mt-1.5 w-full resize-none rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 text-[13px] font-medium leading-relaxed backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/15 disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-[var(--coral)]/30 bg-[var(--coral)]/8 p-3 text-[12px] leading-relaxed text-[var(--coral)]">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || customName.trim().length < 2}
                className="h-11 w-full rounded-full bg-[var(--coral)] font-bold text-white shadow-[0_8px_22px_rgba(225,29,72,0.35)] disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" strokeWidth={2.5} />
                    Spark lagi mikir keras…
                  </>
                ) : (
                  <>
                    <Wand2 size={15} strokeWidth={2.5} />
                    Generate pake Spark AI
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
