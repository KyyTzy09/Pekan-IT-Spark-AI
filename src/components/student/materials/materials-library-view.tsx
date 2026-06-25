"use client";

import { ArrowLeft, BookOpen, Library, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { MaterialCard } from "@/components/student/materials/material-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
type MaterialSource = "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE" | "AI_GENERATED";

interface MaterialLibraryItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  source: MaterialSource;
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
}

interface SubjectOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface MaterialsLibraryViewProps {
  initialResult: { items: MaterialLibraryItem[]; total: number };
  subjectOptions: SubjectOption[];
}

const SOURCE_FILTER: Array<MaterialSource | "ALL"> = [
  "ALL",
  "CHALLENGE",
  "ON_DEMAND",
  "ADAPTIVE",
  "AI_GENERATED",
];

const SOURCE_LABEL: Record<MaterialSource | "ALL", string> = {
  ALL: "Semua",
  CHALLENGE: "Tantangan",
  ON_DEMAND: "Custom",
  ADAPTIVE: "Adaptif",
  AI_GENERATED: "AI",
};

export function MaterialsLibraryView({
  initialResult,
  subjectOptions,
}: MaterialsLibraryViewProps) {
  const [result, setResult] = React.useState(initialResult);
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [source, setSource] = React.useState<MaterialSource | "ALL">("ALL");
  const [loading, setLoading] = React.useState(false);
  const [offset, setOffset] = React.useState(50);

  // Generate material state
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [genSubject, setGenSubject] = React.useState(
    subjectOptions[0]?.id ?? "",
  );
  const [genDifficulty, setGenDifficulty] = React.useState<
    "EASY" | "MEDIUM" | "HARD"
  >("MEDIUM");
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let list = result.items;
    if (subjectId) list = list.filter((m) => m.subject?.id === subjectId);
    if (source !== "ALL") list = list.filter((m) => m.source === source);
    return list;
  }, [result.items, subjectId, source]);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("offset", String(offset));
      if (subjectId) params.set("subjectId", subjectId);
      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setResult({
          items: [...result.items, ...data.items],
          total: data.total,
        });
        setOffset(offset + 50);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!genSubject) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/materials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: genSubject,
          difficulty: genDifficulty,
        }),
      });
      const data = await res.json();
      if (data.ok && data.materialId) {
        setGenerateOpen(false);
        window.location.href = `/materials/${data.materialId}`;
      } else {
        setGenError(data.error ?? "Gagal generate materi");
      }
    } catch {
      setGenError("Network error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.7 0.15 200 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                <Library size={10} strokeWidth={2.5} />
                Perpustakaan
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight sm:text-[28px]">
                Materi <span className="text-gradient-cool">Belajar</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                {result.total} materi tersimpan. Baca, ulangi, dan dalami
                konsepnya.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setGenerateOpen(true)}
              >
                <Sparkles size={13} />
                Generate Materi
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/challenge">
                  <ArrowLeft size={13} />
                  Tantangan
                </Link>
              </Button>
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 p-1 backdrop-blur-sm">
            {SOURCE_FILTER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11.5px] font-bold transition-all",
                  source === s
                    ? "bg-[var(--teal)] text-white shadow-[0_4px_10px_rgba(20,184,166,0.25)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
          {subjectOptions.length > 0 && (
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-9 rounded-full border border-border/40 bg-card/60 px-3 text-[11.5px] font-bold text-foreground outline-none backdrop-blur-sm"
            >
              <option value="">Semua mapel</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon ? `${s.icon} ` : ""}
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <Reveal delay={140}>
          <div className="rounded-3xl border border-border/40 bg-card/80 p-8 text-center shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-10">
            <BookOpen size={28} className="mx-auto text-[var(--teal)]" />
            <p className="mt-3 font-heading text-[16px] font-bold">
              {result.total === 0
                ? "Belum ada materi"
                : "Tidak ada materi sesuai filter"}
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {result.total === 0
                ? "Materi dari tantangan harianmu bakal muncul di sini."
                : "Coba ganti filter di atas."}
            </p>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={140}>
          <div className="space-y-2.5">
            {filtered.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        </Reveal>
      )}

      {result.items.length < result.total && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="h-10 rounded-full"
          >
            {loading ? "Memuat..." : "Muat lebih banyak"}
          </Button>
        </div>
      )}

      {/* Generate Material Dialog */}
      {generateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-border/40 bg-card p-5 shadow-xl">
            <h2 className="font-heading text-[16px] font-bold">
              Generate Materi
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Pilih mapel dan tingkat kesulitan. Limit 7x per hari.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="gen-subject"
                  className="text-[11px] font-bold text-muted-foreground"
                >
                  Mapel
                </label>
                <select
                  id="gen-subject"
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-[12px] outline-none"
                >
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon ? `${s.icon} ` : ""}
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Kesulitan
                </span>
                <div className="mt-1 flex gap-1.5">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setGenDifficulty(d)}
                      className={cn(
                        "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all",
                        genDifficulty === d
                          ? "bg-[var(--teal)] text-white"
                          : "border border-border/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {d === "EASY"
                        ? "Mudah"
                        : d === "MEDIUM"
                          ? "Sedang"
                          : "Sulit"}
                    </button>
                  ))}
                </div>
              </div>

              {genError && (
                <p className="text-[11px] text-red-500">{genError}</p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => {
                  setGenerateOpen(false);
                  setGenError(null);
                }}
                disabled={generating}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={handleGenerate}
                disabled={generating || !genSubject}
              >
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
