"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubjectOption {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    concepts: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

interface GeneratePracticeViewProps {
  subjects: SubjectOption[];
  remainingQuota: { practiceGen: number; topicGen: number };
}

type SourceMode = "concept" | "freeform";

export function GeneratePracticeView({
  subjects,
  remainingQuota,
}: GeneratePracticeViewProps) {
  const router = useRouter();
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("concept");
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>(
    subjects[0]?.id ?? "",
  );
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");
  const [selectedConceptIds, setSelectedConceptIds] = React.useState<string[]>([]);
  const [freeformText, setFreeformText] = React.useState<string>("");
  const [numQuestions, setNumQuestions] = React.useState<number>(5);
  const [generating, setGenerating] = React.useState(false);
  const [generatingTopic, setGeneratingTopic] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedSubject = React.useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId],
  );

  const selectedTopic = React.useMemo(
    () => selectedSubject?.topics.find((t) => t.id === selectedTopicId),
    [selectedSubject, selectedTopicId],
  );

  const handleConceptToggle = (conceptId: string) => {
    setSelectedConceptIds((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId],
    );
  };

  const handleGenerateFromConcepts = async () => {
    if (selectedConceptIds.length === 0) {
      setError("Pilih minimal 1 konsep");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptIds: selectedConceptIds,
          numQuestions,
        }),
      });
      const data = await res.json();
      if (data.ok && data.topicId) {
        router.push(`/practice?topicId=${data.topicId}`);
      } else {
        setError(data.error ?? "Gagal generate soal");
      }
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFreeform = async () => {
    if (!freeformText.trim()) {
      setError("Ketik tema yang mau dipelajari");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/generate-freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: freeformText.trim(),
          numQuestions,
        }),
      });
      const data = await res.json();
      if (data.ok && data.topicId) {
        router.push(`/practice?topicId=${data.topicId}`);
      } else {
        setError(data.error ?? "Gagal generate soal");
      }
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateTopic = async () => {
    if (!selectedSubjectId) {
      setError("Pilih mapel dulu");
      return;
    }
    setGeneratingTopic(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.topicId) {
        // Refresh to show new topic
        router.refresh();
        setSelectedTopicId(data.topicId);
      } else {
        setError(data.error ?? "Gagal generate topik");
      }
    } catch {
      setError("Network error");
    } finally {
      setGeneratingTopic(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.68 0.18 25 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                <Sparkles size={10} strokeWidth={2.5} />
                Generate Custom
              </span>
              <h1 className="mt-2 font-heading text-[22px] font-bold leading-tight sm:text-[26px]">
                Generate{" "}
                <span className="text-gradient-warm">Soal Custom</span>
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Pilih konsep atau ketik tema bebas. AI buatkan soal untukmu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-[11px] backdrop-blur-sm">
                <span className="font-bold text-muted-foreground">Sisa:</span>
                <span className="ml-1 font-bold text-[var(--coral)]">
                  {remainingQuota.practiceGen}x soal
                </span>
                <span className="mx-1 text-muted-foreground">·</span>
                <span className="font-bold text-[var(--purple)]">
                  {remainingQuota.topicGen}x topik
                </span>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/practice">
                  <ArrowLeft size={13} />
                  Kembali
                </Link>
              </Button>
            </div>
          </div>
        </header>
      </Reveal>

      {/* Source Mode Toggle */}
      <Reveal delay={40}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSourceMode("concept")}
            className={cn(
              "flex-1 rounded-2xl border-2 p-4 text-left transition-all",
              sourceMode === "concept"
                ? "border-[var(--teal)] bg-[var(--teal)]/10"
                : "border-border/40 bg-card/60 hover:border-border",
            )}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--teal)]" />
              <span className="text-[13px] font-bold">📚 Dari Konsep</span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Pilih konsep spesifik dari kurikulum
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode("freeform")}
            className={cn(
              "flex-1 rounded-2xl border-2 p-4 text-left transition-all",
              sourceMode === "freeform"
                ? "border-[var(--purple)] bg-[var(--purple)]/10"
                : "border-border/40 bg-card/60 hover:border-border",
            )}
          >
            <div className="flex items-center gap-2">
              <Pencil size={18} className="text-[var(--purple)]" />
              <span className="text-[13px] font-bold">✍️ Ketik Bebas</span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Ketik tema, AI generate soal & topik baru
            </p>
          </button>
        </div>
      </Reveal>

      {/* Concept Mode */}
      {sourceMode === "concept" && (
        <Reveal delay={80}>
          <div className="space-y-4">
            {/* Subject Select */}
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">
                📚 Mapel
              </label>
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedTopicId("");
                    setSelectedConceptIds([]);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-background px-4 pr-10 text-[13px] font-medium outline-none transition-colors focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon ? `${s.icon} ` : ""}
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ▾
                </div>
              </div>
            </div>

            {/* Topic Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-bold text-foreground">
                  📖 Topik
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full text-[11px]"
                  onClick={handleGenerateTopic}
                  disabled={generatingTopic || remainingQuota.topicGen <= 0}
                >
                  {generatingTopic ? (
                    <>
                      <Loader2 size={12} className="mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="mr-1" />
                      Generate Topik Baru
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    setSelectedConceptIds([]);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-background px-4 pr-10 text-[13px] font-medium outline-none transition-colors focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                >
                  <option value="">Pilih topik...</option>
                  {selectedSubject?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ▾
                </div>
              </div>
            </div>

            {/* Concept Multi-Select */}
            {selectedTopic && selectedTopic.concepts.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-foreground">
                  🎯 Konsep (pilih satu atau lebih)
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTopic.concepts.map((c) => {
                    const isSelected = selectedConceptIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleConceptToggle(c.id)}
                        className={cn(
                          "rounded-full border-2 px-3 py-1.5 text-[12px] font-bold transition-all",
                          isSelected
                            ? "border-[var(--teal)] bg-[var(--teal)]/10 text-[var(--teal)]"
                            : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        {isSelected ? "☑" : "☐"} {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Freeform Mode */}
      {sourceMode === "freeform" && (
        <Reveal delay={80}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-foreground">
                ✍️ Mau latihan soal tentang apa?
              </label>
              <textarea
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder="Contoh: soal cerita tentang pecahan dan persen, atau persamaan kuadrat untuk persiapan ujian..."
                className="h-24 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                AI akan generate topik baru + soal sesuai tema yang kamu ketik
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Num Questions */}
      <Reveal delay={100}>
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-foreground">
            📊 Jumlah Soal
          </label>
          <div className="flex gap-2">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumQuestions(n)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-3 text-[14px] font-bold transition-all",
                  numQuestions === n
                    ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {n} soal
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[12px] font-medium text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Generate Button */}
      <Reveal delay={120}>
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] font-bold text-white shadow-lg shadow-[var(--coral)]/25"
          onClick={
            sourceMode === "concept"
              ? handleGenerateFromConcepts
              : handleGenerateFreeform
          }
          disabled={
            generating ||
            (sourceMode === "concept" && selectedConceptIds.length === 0) ||
            (sourceMode === "freeform" && !freeformText.trim()) ||
            remainingQuota.practiceGen <= 0
          }
        >
          {generating ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Generating...
            </>
          ) : remainingQuota.practiceGen <= 0 ? (
            <>
              <Zap size={18} className="mr-2" />
              Kuota habis (reset besok)
            </>
          ) : (
            <>
              <Sparkles size={18} className="mr-2" />
              Generate {numQuestions} Soal
            </>
          )}
        </Button>
      </Reveal>
    </div>
  );
}
