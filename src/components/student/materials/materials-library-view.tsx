"use client";

import { ArrowLeft, BookOpen, Library, Sparkles, X } from "lucide-react";
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget && !generating) {
              setGenerateOpen(false);
              setGenError(null);
            }
          }}
        >
          <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-border/40 bg-card shadow-2xl">
            {/* Header gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] p-6 pb-5">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!generating) {
                    setGenerateOpen(false);
                    setGenError(null);
                  }
                }}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                disabled={generating}
              >
                <X size={16} />
              </button>
              <div className="relative">
                <div className="grid size-10 place-items-center rounded-2xl bg-white/20 text-white">
                  <Sparkles size={20} />
                </div>
                <h2 className="mt-3 font-heading text-[20px] font-bold text-white">
                  Generate Materi
                </h2>
                <p className="mt-1 text-[12.5px] text-white/80">
                  Buat materi belajar custom sesuai kebutuhanmu
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Subject Select */}
                <div>
                  <label
                    htmlFor="gen-subject"
                    className="mb-1.5 block text-[12px] font-bold text-foreground"
                  >
                    📚 Pilih Mapel
                  </label>
                  <div className="relative">
                    <select
                      id="gen-subject"
                      value={genSubject}
                      onChange={(e) => setGenSubject(e.target.value)}
                      className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-background px-4 pr-10 text-[13px] font-medium outline-none transition-colors focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20"
                    >
                      {subjectOptions.map((s) => (
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

                {/* Difficulty Select */}
                <div>
                  <span className="mb-1.5 block text-[12px] font-bold text-foreground">
                    🎯 Tingkat Kesulitan
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          value: "EASY",
                          label: "Mudah",
                          emoji: "🌱",
                          desc: "Pemula",
                        },
                        {
                          value: "MEDIUM",
                          label: "Sedang",
                          emoji: "⚡",
                          desc: "Menengah",
                        },
                        {
                          value: "HARD",
                          label: "Sulit",
                          emoji: "🔥",
                          desc: "Lanjutan",
                        },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setGenDifficulty(d.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all",
                          genDifficulty === d.value
                            ? "border-[var(--teal)] bg-[var(--teal)]/10 text-[var(--teal)]"
                            : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        <span className="text-[18px]">{d.emoji}</span>
                        <span className="text-[12px] font-bold">{d.label}</span>
                        <span className="text-[10px] opacity-70">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                    ℹ️ Materi akan di-generate oleh AI sesuai gaya belajarmu.
                    Limit{" "}
                    <span className="font-bold text-foreground">
                      7x per hari
                    </span>
                    .
                  </p>
                </div>

                {/* Error */}
                {genError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-[12px] font-medium text-red-600">
                      ❌ {genError}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="flex-1 rounded-xl"
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
                  size="default"
                  className="flex-1 rounded-xl bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] font-bold text-white shadow-lg shadow-[var(--teal)]/25"
                  onClick={handleGenerate}
                  disabled={generating || !genSubject}
                >
                  {generating ? (
                    <>
                      <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} className="mr-1.5" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
