"use client";

import { Loader2, Search, Wand2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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
    ? subjects.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
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
      console.error(
        "[ONBOARDING_SERVICE] generateCustomSubjectPretest error:",
        err,
      );
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (isGenerating) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isGenerating) e.preventDefault();
        }}
        className="max-w-lg overflow-hidden border-2 border-border/60 bg-card p-0"
      >
        <DialogHeader className="border-b border-border/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--purple)]">
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
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-background disabled:opacity-40"
              aria-label="Tutup"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5 sm:max-h-[480px]">
          {!showCustomForm ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative flex items-center rounded-xl border-2 border-border/60 bg-background/80 transition-colors focus-within:border-[var(--coral)] focus-within:ring-4 focus-within:ring-[var(--coral)]/10">
                <span className="grid size-11 place-items-center text-muted-foreground">
                  <Search size={18} />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari mapel nasional..."
                  className="h-12 w-full bg-transparent pr-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Subject grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map((s) => {
                  const active = selectedSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onToggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                        active
                          ? "border-[var(--coral)] bg-[var(--coral)]/8 ring-4 ring-[var(--coral)]/10"
                          : "border-border/60 bg-background/80 hover:border-border",
                      )}
                    >
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-md text-white"
                        style={{
                          background: s.color
                            ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                            : "linear-gradient(135deg, var(--coral), var(--orange))",
                        }}
                      >
                        <span className="text-[16px]">{s.icon ?? "📚"}</span>
                      </span>
                      <span className="text-[13px] font-bold text-foreground">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom form trigger */}
              <div className="border-t border-border/40 pt-4">
                <p className="mb-2.5 text-[12px] font-semibold text-muted-foreground">
                  Mapel kamu tidak ada di daftar?
                </p>
                <Button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="h-12 w-full rounded-lg bg-gradient-to-r from-[var(--purple)] to-[var(--pink)] font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
                >
                  <Wand2 size={16} strokeWidth={2.5} />
                  Bikin mapel custom + AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* AI info */}
              <div className="rounded-xl border-2 border-[var(--purple)]/30 bg-[var(--purple)]/5 p-4 text-[13px] leading-relaxed text-foreground/80">
                <p className="font-bold text-[var(--purple)]">
                  🪄 Spark AI bakal:
                </p>
                <ul className="mt-2 space-y-1.5 pl-4">
                  <li>• Bikin 3-6 topik sesuai mapel kamu</li>
                  <li>• Generate 3-6 konsep per topik</li>
                  <li>• Bikin 5-8 soal pretest untuk ukur kemampuan awal</li>
                </ul>
              </div>

              {/* Name input */}
              <section>
                <label
                  htmlFor="search-subject-name"
                  className="mb-2 block text-[13px] font-bold text-foreground"
                >
                  Nama mapel
                </label>
                <input
                  id="search-subject-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Bahasa Jawa, Coding, Musik..."
                  maxLength={60}
                  disabled={isGenerating}
                  className="h-12 w-full rounded-xl border-2 border-border/60 bg-background/80 px-4 text-[15px] font-semibold transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)] focus:outline-none focus:ring-4 focus:ring-[var(--coral)]/10 disabled:opacity-50"
                />
              </section>

              {/* Context textarea */}
              <section>
                <label
                  htmlFor="search-subject-context"
                  className="mb-2 block text-[13px] font-bold text-foreground"
                >
                  Konteks tambahan (opsional)
                </label>
                <textarea
                  id="search-subject-context"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Boleh kosong. Kasih tau Spark fokus yang kamu mau."
                  maxLength={280}
                  rows={3}
                  disabled={isGenerating}
                  className="w-full resize-none rounded-xl border-2 border-border/60 bg-background/80 px-4 py-3 text-[14px] font-medium leading-relaxed transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)] focus:outline-none focus:ring-4 focus:ring-[var(--coral)]/10 disabled:opacity-50"
                />
              </section>

              {/* Error */}
              {error && (
                <div className="rounded-xl border-2 border-[var(--coral)]/40 bg-[var(--coral)]/8 p-4 text-[13px] leading-relaxed text-[var(--coral)]">
                  ⚠️ {error}
                </div>
              )}

              {/* Generate button */}
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || customName.trim().length < 2}
                className="h-12 w-full rounded-lg bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.3)] disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                      strokeWidth={2.5}
                    />
                    Spark lagi mikir keras...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} strokeWidth={2.5} />
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
