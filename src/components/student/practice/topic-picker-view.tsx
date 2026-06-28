"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Flame,
  Loader2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopicRecommendation {
  topicId: string;
  topicName: string;
  topicSlug: string;
  subjectName: string;
  subjectSlug: string;
  subjectIcon: string | null;
  subjectColor: string | null;
  masteryPct: number;
  weakConceptCount: number;
  totalConceptCount: number;
  recommendationReason: string;
}

interface TopicPickerViewProps {
  topics: TopicRecommendation[];
  subjects: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>;
  subjectSlug?: string;
}

function getMasteryColor(pct: number): string {
  if (pct >= 70) return "var(--emerald)";
  if (pct >= 40) return "var(--yellow)";
  return "var(--coral)";
}

function getMasteryLabel(pct: number): string {
  if (pct >= 70) return "Kuat";
  if (pct >= 40) return "Sedang";
  return "Lemah";
}

function getMasteryEmoji(pct: number): string {
  if (pct >= 70) return "🟢";
  if (pct >= 40) return "🟡";
  return "🔴";
}

export function TopicPickerView({
  topics,
  subjects,
  subjectSlug,
}: TopicPickerViewProps) {
  const [selectedSubject, setSelectedSubject] = React.useState<string>(
    subjectSlug ?? "",
  );

  const filteredTopics = React.useMemo(() => {
    if (!selectedSubject) return topics;
    return topics.filter((t) => t.subjectSlug === selectedSubject);
  }, [topics, selectedSubject]);

  const recommendations = React.useMemo(() => {
    return filteredTopics
      .filter((t) => t.weakConceptCount > 0 || t.masteryPct < 70)
      .sort((a, b) => a.masteryPct - b.masteryPct)
      .slice(0, 3);
  }, [filteredTopics]);

  const allTopics = React.useMemo(() => {
    return filteredTopics.sort((a, b) =>
      a.topicName.localeCompare(b.topicName),
    );
  }, [filteredTopics]);

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 200 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                <BookOpen size={10} strokeWidth={2.5} />
                Pilih Topik
              </span>
              <h1 className="mt-2 font-heading text-[22px] font-bold leading-tight sm:text-[26px]">
                Pilih Topik <span className="text-gradient-cool">Latihan</span>
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Pilih topik yang mau kamu latih. Rekomendasi berdasarkan
                kelemahanmu.
              </p>
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
        </header>
      </Reveal>

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <Reveal delay={40}>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Filter Mapel
            </span>
            <div className="flex flex-wrap gap-2 pb-1">
              <button
                type="button"
                onClick={() => setSelectedSubject("")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all border",
                  !selectedSubject
                    ? "bg-[var(--teal)] border-[var(--teal)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.25)]"
                    : "bg-card/60 hover:bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <span>📚</span>
                <span>Semua Mapel</span>
              </button>
              {subjects.map((sub) => {
                const isSelected = selectedSubject === sub.slug;
                const subColor = sub.color || "var(--teal)";
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubject(sub.slug)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all border",
                      isSelected
                        ? "text-white"
                        : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground hover:bg-card/90",
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: subColor,
                            borderColor: subColor,
                            boxShadow: `0 4px 12px ${subColor}30`,
                          }
                        : {
                            borderColor: `${subColor}20`,
                          }
                    }
                  >
                    <span className="text-[14px]">{sub.icon ?? "📚"}</span>
                    <span>{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Reveal delay={80}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <Star size={14} className="text-[var(--yellow)]" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                Rekomendasi Untukmu
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recommendations.map((topic) => {
                const masteryColor = getMasteryColor(topic.masteryPct);
                return (
                  <Link
                    key={topic.topicId}
                    href={`/practice?topicId=${topic.topicId}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur-xl transition-all hover:border-transparent hover:shadow-[0_8px_24px_rgba(80,20,50,0.1)] hover:-translate-y-0.5"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-0 blur-xl transition-opacity group-hover:opacity-30"
                      style={{
                        background: `radial-gradient(circle, ${masteryColor}, transparent 70%)`,
                      }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">
                          {getMasteryEmoji(topic.masteryPct)}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: masteryColor }}
                        >
                          {getMasteryLabel(topic.masteryPct)}
                        </span>
                      </div>
                      <h3 className="mt-2 font-heading text-[15px] font-bold leading-tight">
                        {topic.topicName}
                      </h3>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {topic.subjectName} · {topic.totalConceptCount} konsep
                      </p>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                        {topic.recommendationReason}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted/60">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${topic.masteryPct}%`,
                              backgroundColor: masteryColor,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {topic.masteryPct}%
                        </span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                        Mulai Latihan
                        <ArrowRight
                          size={12}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* All Topics */}
      <Reveal delay={120}>
        <div className="space-y-3">
          <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Semua Topik
          </span>
          {allTopics.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-6 text-center text-[12.5px] text-muted-foreground">
              Belum ada topik tersedia.
            </div>
          ) : (
            <div className="grid gap-2">
              {allTopics.map((topic) => {
                const masteryColor = getMasteryColor(topic.masteryPct);
                return (
                  <Link
                    key={topic.topicId}
                    href={`/practice?topicId=${topic.topicId}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm transition-all hover:border-border hover:bg-card/80"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">
                          {getMasteryEmoji(topic.masteryPct)}
                        </span>
                        <h3 className="font-heading text-[14px] font-bold leading-tight truncate">
                          {topic.topicName}
                        </h3>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {topic.subjectName} · {topic.totalConceptCount} konsep
                        {topic.weakConceptCount > 0 && (
                          <span className="ml-1 text-[var(--coral)]">
                            · {topic.weakConceptCount} lemah
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 overflow-hidden rounded-full bg-muted/60">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${topic.masteryPct}%`,
                                backgroundColor: masteryColor,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">
                            {topic.masteryPct}%
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
