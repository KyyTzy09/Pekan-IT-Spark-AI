"use client";

import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { QuotaExhaustedModal } from "@/components/student/quota-exhausted-modal";
import { useQuotaModal } from "@/components/student/use-quota-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function GeneratePracticeView({
  subjects,
  remainingQuota,
}: GeneratePracticeViewProps) {
  const router = useRouter();
  const quotaModal = useQuotaModal();
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>(
    subjects[0]?.id ?? "",
  );
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");
  const [selectedConceptIds, setSelectedConceptIds] = React.useState<string[]>(
    [],
  );
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
    if (remainingQuota.practiceGen <= 0) {
      quotaModal.showQuotaModal("Generate Soal");
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

  const handleGenerateTopic = async () => {
    if (!selectedSubjectId) {
      setError("Pilih mapel dulu");
      return;
    }
    if (remainingQuota.topicGen <= 0) {
      quotaModal.showQuotaModal("Generate Topik");
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

  if (subjects.length === 0) {
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
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                <Sparkles size={10} strokeWidth={2.5} />
                Generate Custom
              </span>
              <h1 className="mt-2 font-heading text-[22px] font-bold leading-tight sm:text-[26px]">
                Generate <span className="text-gradient-warm">Soal Custom</span>
              </h1>
              <p className="mt-3 text-[13px] text-muted-foreground">
                Kamu belum punya mapel fokus. Tambahkan mapel dulu lewat
                onboarding atau halaman mapel.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/subjects">Jelajahi Mapel</Link>
                </Button>
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
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <QuotaExhaustedModal
        open={quotaModal.open}
        onClose={quotaModal.hideQuotaModal}
        quotaType={quotaModal.quotaType}
      />

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
                Generate <span className="text-gradient-warm">Soal Custom</span>
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Pilih konsep dari mapel fokusmu. AI buatkan soal untukmu.
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

      {/* Concept Mode */}
      <Reveal delay={80}>
        <div className="space-y-4">
          {/* Subject Select */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-foreground">
              📚 Mapel
            </label>
            <Select
              value={selectedSubjectId}
              onValueChange={(val) => {
                setSelectedSubjectId(val);
                setSelectedTopicId("");
                setSelectedConceptIds([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih mapel..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.icon ? `${s.icon} ` : ""}
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select
              value={selectedTopicId}
              onValueChange={(val) => {
                setSelectedTopicId(val);
                setSelectedConceptIds([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih topik..." />
              </SelectTrigger>
              <SelectContent>
                {selectedSubject?.topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          onClick={handleGenerateFromConcepts}
          disabled={
            generating ||
            selectedConceptIds.length === 0 ||
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
