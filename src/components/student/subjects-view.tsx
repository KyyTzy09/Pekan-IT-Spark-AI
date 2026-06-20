"use client";

import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Heart,
  Layers,
  Loader2,
  Lock,
  Sparkles,
  Star,
  Target,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Constellation } from "@/components/student/constellation-view";
import { GeneratePracticeDialog } from "@/components/student/generate-practice-dialog";
import { MaterialLevelsView } from "@/components/student/material-levels-view";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SubjectExplorerSummary } from "@/server/actions/dashboard";
import { generatePracticeQuestionsForSubject } from "@/server/actions/generate-practice-questions";
import {
  generateMaterialsForSubject,
  toggleSubjectFavorite,
} from "@/server/actions/subjects";

export type SubjectListItem = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  totalConcepts: number;
  averageMastery: number;
  mastered: number;
  isCustom: boolean;
  source: "OFFICIAL" | "AI_GENERATED" | "USER_CREATED";
};

export function SubjectsListView({
  subjects,
  focusedIds,
  addAction,
}: {
  subjects: SubjectListItem[];
  focusedIds: string[];
  addAction?: React.ReactNode;
}) {
  const focused = subjects.filter((s) => focusedIds.includes(s.id));
  const otherOfficial = subjects.filter(
    (s) => !s.isCustom && !focusedIds.includes(s.id),
  );
  const custom = subjects.filter(
    (s) => s.isCustom && !focusedIds.includes(s.id),
  );
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                Mata pelajaran
              </p>
              <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
                Pilih dan dalami{" "}
                <span className="text-gradient-warm">dunia Spark</span> ✨
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
                Tap mata pelajaran buat liat skill tree, konsep yang siap
                dipelajari, dan progress konstelasi kamu. Tap dan tahan mapel
                buat nambahin atau hapus dari favorit.
              </p>
            </div>
            {addAction}
          </div>
        </header>
      </Reveal>

      {focused.length > 0 && (
        <Reveal delay={60}>
          <section>
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  Favorit kamu
                </p>
                <h2 className="mt-0.5 flex items-center gap-1.5 font-heading text-[16px] font-bold leading-tight">
                  <Heart
                    size={14}
                    className="fill-[var(--coral)] text-[var(--coral)]"
                  />
                  Mata pelajaran yang kamu minati
                </h2>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  Mapel yang kamu pilih pas onboarding — Spark prioritasin ini
                  buat rekomendasi, tantangan, dan latihan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl text-[11px] font-bold"
                >
                  <Link href="/subjects/manage">
                    <Heart size={12} className="mr-1" />
                    Kelola
                  </Link>
                </Button>
                <span className="rounded-full bg-[var(--coral)]/8 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--coral)] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.18)]">
                  {focused.length} mapel
                </span>
              </div>
            </header>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {focused.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  isFocused={focusedIds.includes(s.id)}
                  focusedIds={focusedIds}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {otherOfficial.length > 0 && (
        <Reveal delay={100}>
          <section>
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">
                  Kurikulum nasional
                </p>
                <h2 className="mt-0.5 font-heading text-[16px] font-bold leading-tight">
                  Mata pelajaran lainnya
                </h2>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  Tap buat tambahin ke favorit, dan Spark bakal mulai susun
                  skill tree + soal pretest.
                </p>
              </div>
              <span className="rounded-full bg-[var(--blue)]/8 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--blue)] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]">
                {otherOfficial.length} mapel
              </span>
            </header>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {otherOfficial.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  isFocused={focusedIds.includes(s.id)}
                  focusedIds={focusedIds}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {custom.length > 0 && (
        <Reveal delay={140}>
          <section>
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  Mapel kamu
                </p>
                <h2 className="mt-0.5 flex items-center gap-1.5 font-heading text-[16px] font-bold leading-tight">
                  <Wand2
                    size={13}
                    strokeWidth={2.5}
                    className="text-[var(--purple)]"
                  />
                  AI Custom
                </h2>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  <Sparkles size={10} className="text-[var(--purple)]" />
                  Mapel di bawah ini AI-generated — bukan kurikulum nasional.
                  Tetap konfirmasi ke guru untuk hal penting.
                </p>
              </div>
              <span className="rounded-full bg-[var(--purple)]/8 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--purple)] shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)]">
                {custom.length} mapel
              </span>
            </header>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {custom.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  isFocused={focusedIds.includes(s.id)}
                  focusedIds={focusedIds}
                />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  isFocused,
  focusedIds,
}: {
  subject: SubjectListItem;
  isFocused: boolean;
  focusedIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [practiceDialogOpen, setPracticeDialogOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const menuRef = React.useRef<HTMLDivElement>(null);
  const isLongPress = React.useRef(false);

  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, closeMenu]);

  const startLongPress = React.useCallback(() => {
    isLongPress.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setMenuOpen(true);
    }, 500);
  }, []);

  const cancelLongPress = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      cancelLongPress();
      if (isLongPress.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!menuOpen) {
        router.push(`/subjects/${subject.slug.toLowerCase()}`);
      }
    },
    [cancelLongPress, menuOpen, router, subject.slug],
  );

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(true);
  }, []);

  const handleToggle = React.useCallback(() => {
    startTransition(async () => {
      const result = await toggleSubjectFavorite({ subjectId: subject.id });
      if (result.ok) {
        setMenuOpen(false);
      }
    });
  }, [subject.id]);

  const handleGenerateMaterials = React.useCallback(async () => {
    setIsGenerating(true);
    setMenuOpen(false);
    try {
      const result = await generateMaterialsForSubject(subject.id);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Gagal generate materi");
      }
    } catch {
      alert("Gagal generate materi");
    } finally {
      setIsGenerating(false);
    }
  }, [subject.id, router]);

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onPointerDown={startLongPress}
        onPointerUp={handlePointerUp}
        onPointerLeave={cancelLongPress}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            router.push(`/subjects/${subject.slug.toLowerCase()}`);
          }
        }}
        className={cn(
          "group/sub relative overflow-hidden rounded-2xl border border-border/40 bg-card/85 p-5 shadow-[0_8px_22px_rgba(80,20,50,0.06)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(80,20,50,0.14)]",
          menuOpen && "ring-2 ring-[var(--coral)]",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full opacity-25 blur-3xl transition-opacity group-hover/sub:opacity-50"
          style={{
            background: subject.color
              ? `linear-gradient(135deg, ${subject.color}, transparent)`
              : "linear-gradient(135deg, var(--coral), transparent)",
          }}
        />
        <div className="relative flex items-start gap-4">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
            style={{
              background: subject.color
                ? `linear-gradient(135deg, ${subject.color}, oklch(0.65 0.15 60))`
                : "linear-gradient(135deg, var(--coral), var(--orange))",
            }}
          >
            <span className="text-[20px]">{subject.icon ?? "📚"}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-[16px] font-bold text-foreground">
                {subject.name}
              </h3>
              {isFocused && (
                <span className="rounded-full bg-[var(--coral)]/8 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--coral)] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.18)]">
                  Fokus
                </span>
              )}
              {subject.isCustom && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--purple)]/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--purple)] shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)]"
                  title="Mapel ini AI-generated oleh Spark, bukan kurikulum nasional"
                >
                  <Wand2 size={8} strokeWidth={2.5} />
                  AI-generated
                </span>
              )}
            </div>
            {subject.description && (
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {subject.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground">
                <CircleDashed size={10} />
                {subject.totalConcepts} konsep
              </div>
              <span className="font-heading text-[13px] font-bold tabular-nums text-foreground">
                {subject.averageMastery}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${subject.averageMastery}%`,
                  background: subject.color
                    ? `linear-gradient(90deg, ${subject.color}, oklch(0.7 0.15 60))`
                    : "linear-gradient(90deg, var(--coral), var(--orange))",
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {subject.mastered > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--teal)]/8 px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--teal)] shadow-[inset_0_0_0_1px_rgba(20,184,166,0.2)]">
                    <CheckCircle2 size={9} />
                    {subject.mastered} ⭐
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition-colors group-hover/sub:text-[var(--coral)]">
                Buka
                <ChevronRight
                  size={12}
                  className="transition-transform group-hover/sub:translate-x-0.5"
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute left-1/2 top-1/2 z-20 w-52 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/50 bg-card p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-[12px]"
            onClick={handleToggle}
            disabled={isPending}
          >
            <Heart
              size={14}
              className={cn(
                isFocused
                  ? "fill-[var(--coral)] text-[var(--coral)]"
                  : "text-muted-foreground",
              )}
            />
            {isFocused ? "Hapus dari Favorit" : "Tambah ke Favorit"}
          </Button>
          {subject.isCustom && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-[12px]"
              onClick={handleGenerateMaterials}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2
                  size={14}
                  className="animate-spin text-[var(--purple)]"
                />
              ) : (
                <Sparkles size={14} className="text-[var(--purple)]" />
              )}
              {isGenerating ? "Generating..." : "Generate Materi"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-[12px]"
            onClick={() => {
              setMenuOpen(false);
              setPracticeDialogOpen(true);
            }}
          >
            <Target size={14} className="text-[var(--blue)]" />
            Generate Latihan Soal
          </Button>
        </div>
      )}
      {practiceDialogOpen && (
        <GeneratePracticeDialog
          open={practiceDialogOpen}
          onClose={() => setPracticeDialogOpen(false)}
          subjects={[
            {
              id: subject.id,
              name: subject.name,
              icon: subject.icon,
              color: subject.color,
            },
          ]}
          onGenerate={async (subjectId, count) => {
            const result = await generatePracticeQuestionsForSubject({
              subjectId,
              totalCount: count,
            });
            if (result.ok) {
              router.refresh();
            } else {
              alert(result.error || "Gagal generate soal");
            }
          }}
        />
      )}
    </div>
  );
}

export function SubjectDetailView({
  summary,
}: {
  summary: SubjectExplorerSummary;
}) {
  const { subject, topics, totalConcepts, masteredConcepts, pretestCompleted } =
    summary;
  const pct =
    totalConcepts > 0
      ? Math.round((masteredConcepts / totalConcepts) * 100)
      : 0;
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background: subject.color
                ? `radial-gradient(circle, ${subject.color}55, transparent 70%)`
                : "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-[0_10px_22px_rgba(0,0,0,0.14)]"
              style={{
                background: subject.color
                  ? `linear-gradient(135deg, ${subject.color}, oklch(0.65 0.15 60))`
                  : "linear-gradient(135deg, var(--coral), var(--orange))",
              }}
            >
              <span className="text-[24px]">{subject.icon ?? "📚"}</span>
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Mata pelajaran
                </p>
                {subject.isCustom && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--purple)]/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)] shadow-[inset_0_0_0_1px_rgba(168,85,247,0.22)]"
                    title="Mapel ini AI-generated oleh Spark, bukan kurikulum nasional"
                  >
                    <Wand2 size={9} strokeWidth={2.5} />
                    AI-generated
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  {subject.description}
                </p>
              )}
              {subject.isCustom && (
                <>
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 px-3 py-2 text-[11.5px] leading-relaxed text-[var(--purple)] dark:text-[var(--purple)]">
                    <Sparkles size={12} className="mt-0.5 shrink-0" />
                    <span>
                      Mapel ini AI-generated oleh Spark — bukan kurikulum
                      nasional. Selalu konfirmasi materi ke guru untuk hal-hal
                      penting.
                    </span>
                  </p>
                  {!pretestCompleted && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 shadow-sm">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2">
                          <Star
                            size={16}
                            className="mt-0.5 shrink-0 text-amber-500"
                            fill="currentColor"
                          />
                          <div>
                            <p className="text-[12px] font-bold text-amber-600 dark:text-amber-500">
                              Uji Kemampuan Awal
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                              Ambil pretest untuk mengukur tingkat pemahaman
                              awal kamu pada mata pelajaran kustom ini.
                            </p>
                          </div>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.25)] shrink-0 self-start sm:self-center"
                        >
                          <Link href={`/practice/pretest/${subject.id}`}>
                            Mulai Pretest
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-[11px] font-bold text-foreground/85 shadow-[inset_0_0_0_1px_rgba(80,20,50,0.04)] backdrop-blur-sm">
                <Star
                  size={11}
                  className="text-[var(--yellow)]"
                  fill="currentColor"
                />
                {masteredConcepts} / {totalConcepts} dikuasai
              </div>
              {pretestCompleted ? (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
                >
                  <Link href="/practice">
                    <Sparkles size={13} strokeWidth={2.5} />
                    Latihan sekarang
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-amber-500 text-white shadow-[0_6px_18px_rgba(245,158,11,0.25)] hover:bg-amber-600 animate-pulse"
                >
                  <Link href={`/practice/pretest/${subject.id}`}>
                    <Star size={13} strokeWidth={2.5} fill="currentColor" />
                    Ambil Pretest Dulu
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-3 sm:gap-4">
            <Stat
              label="Topik"
              value={String(topics.length)}
              accent="from-[var(--blue)] to-[var(--teal)]"
            />
            <Stat
              label="Konsep dikuasai"
              value={String(masteredConcepts)}
              accent="from-[var(--teal)] to-[var(--green)]"
            />
            <Stat
              label="Progress"
              value={`${pct}%`}
              accent="from-[var(--coral)] to-[var(--orange)]"
            />
          </div>
          <div className="relative mt-4">
            <Progress value={pct} className="h-2.5 bg-muted/80" />
          </div>
        </header>
      </Reveal>

      {pretestCompleted ? (
        <Reveal delay={80}>
          <section>
            <header className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  Topik
                </p>
                <h2 className="mt-1 font-heading text-[20px] font-bold leading-tight text-foreground">
                  Skill tree
                </h2>
              </div>
              <span className="text-[10.5px] font-semibold text-muted-foreground">
                Tap topik buat liat konstelasi konsep
              </span>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((t) => (
                <TopicCard key={t.id} topic={t} subjectColor={subject.color} />
              ))}
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal delay={80}>
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 text-center shadow-md sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-10 blur-3xl"
              style={{
                background: "radial-gradient(circle, #f59e0b, transparent 70%)",
              }}
            />
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 animate-pulse">
              <Lock size={26} strokeWidth={2.5} />
            </div>
            <h3 className="font-heading text-[18px] font-bold text-foreground">
              Materi & Latihan Terkunci 🔒
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              Ukur tingkat pemahaman awal kamu terlebih dahulu agar Spark AI
              dapat menyesuaikan materi belajar serta tingkat kesulitan soal
              latihan adaptif untukmu!
            </p>
            <div className="mt-5">
              <Button
                asChild
                className="rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.3)] font-bold px-6 py-5 text-sm"
              >
                <Link href={`/practice/pretest/${subject.id}`}>
                  Mulai Pretest Sekarang 🚀
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-3 backdrop-blur-sm">
      <div
        className={cn("mb-1 h-1.5 w-10 rounded-full bg-gradient-to-r", accent)}
      />
      <p className="font-heading text-[20px] font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TopicCard({
  topic,
  subjectColor,
}: {
  topic: SubjectExplorerSummary["topics"][number];
  subjectColor: string | null;
}) {
  return (
    <Link
      href={`/topics/${topic.id}`}
      className="group/tp relative overflow-hidden rounded-2xl border border-border/40 bg-card/85 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.05)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(80,20,50,0.12)]"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_6px_14px_rgba(0,0,0,0.1)]"
          style={{
            background: subjectColor
              ? `linear-gradient(135deg, ${subjectColor}, oklch(0.65 0.15 60))`
              : "linear-gradient(135deg, var(--coral), var(--orange))",
          }}
        >
          <Layers size={16} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-heading text-[14.5px] font-bold text-foreground">
              {topic.name}
            </h3>
            <span className="font-heading text-[13px] font-bold tabular-nums text-foreground">
              {topic.averageMastery}%
            </span>
          </div>
          <p className="mt-0.5 text-[10.5px] font-semibold text-muted-foreground">
            {topic.totalConcepts} konsep · {topic.masteredConcepts} dikuasai
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${topic.averageMastery}%`,
                background: subjectColor
                  ? `linear-gradient(90deg, ${subjectColor}, oklch(0.7 0.15 60))`
                  : "linear-gradient(90deg, var(--coral), var(--orange))",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              {topic.masteredConcepts === topic.totalConcepts &&
              topic.totalConcepts > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--teal)]/8 px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--teal)] shadow-[inset_0_0_0_1px_rgba(20,184,166,0.2)]">
                  <CheckCircle2 size={9} />
                  Tuntas
                </span>
              ) : topic.masteredConcepts > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--yellow)]/8 px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--yellow)] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
                  <BookOpen size={9} />
                  Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                  <Lock size={9} />
                  Baru
                </span>
              )}
            </div>
            <ChevronRight
              size={12}
              className="text-muted-foreground transition-transform group-hover/tp:translate-x-0.5 group-hover/tp:text-[var(--coral)]"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TopicDetailView({
  topic,
}: {
  topic: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    subjectName: string;
    subjectSlug: string;
    subjectColor: string | null;
    subjectIcon: string | null;
    totalConcepts: number;
    masteredConcepts: number;
    averageMastery: number;
    concepts: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
      masteryScore: number;
      isLocked: boolean;
      unmetPrerequisites: Array<{ id: string; name: string }>;
      materials: Array<{ id: string; difficulty: string }>;
    }>;
  };
}) {
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background: topic.subjectColor
                ? `radial-gradient(circle, ${topic.subjectColor}55, transparent 70%)`
                : "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
            }}
          />
          <nav className="relative flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Link
              href="/subjects"
              className="transition-colors hover:text-foreground"
            >
              Mapel
            </Link>
            <ChevronRight size={11} />
            <Link
              href={`/subjects/${topic.subjectSlug.toLowerCase()}`}
              className="transition-colors hover:text-foreground"
            >
              {topic.subjectName}
            </Link>
            <ChevronRight size={11} />
            <span className="text-foreground">{topic.name}</span>
          </nav>
          <div className="relative mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
              style={{
                background: topic.subjectColor
                  ? `linear-gradient(135deg, ${topic.subjectColor}, oklch(0.65 0.15 60))`
                  : "linear-gradient(135deg, var(--coral), var(--orange))",
              }}
            >
              <span className="text-[20px]">{topic.subjectIcon ?? "📚"}</span>
            </span>
            <div className="flex-1">
              <h1 className="font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[30px]">
                {topic.name}
              </h1>
              {topic.description && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <span className="inline-flex items-center justify-end gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-[11px] font-bold text-foreground/85 backdrop-blur-sm">
                <Star
                  size={11}
                  className="text-[var(--yellow)]"
                  fill="currentColor"
                />
                {topic.masteredConcepts} / {topic.totalConcepts} dikuasai
              </span>
              <span className="font-heading text-[28px] font-bold tabular-nums text-foreground">
                {topic.averageMastery}%
              </span>
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <section>
          <header className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                Konstelasi
              </p>
              <h2 className="mt-1 font-heading text-[20px] font-bold leading-tight text-foreground">
                Bintang konsep
              </h2>
            </div>
            <span className="text-[10.5px] font-semibold text-muted-foreground">
              Bintang menyala = sudah dikuasai
            </span>
          </header>
          <Constellation concepts={topic.concepts} />
        </section>
      </Reveal>

      <Reveal delay={120}>
        <section>
          <header className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">
                Level Materi
              </p>
              <h2 className="mt-1 font-heading text-[20px] font-bold leading-tight text-foreground">
                Pilih level kesulitan
              </h2>
            </div>
            <span className="text-[10.5px] font-semibold text-muted-foreground">
              Dasar · Menengah · Lanjutan
            </span>
          </header>
          <div className="space-y-3">
            {topic.concepts.map((concept) => (
              <div
                key={concept.id}
                className="rounded-2xl border border-border/40 bg-card/85 p-4 shadow-[0_4px_12px_rgba(80,20,50,0.04)]"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-heading text-[14px] font-bold text-foreground">
                    {concept.name}
                  </h3>
                  <span className="font-heading text-[12px] font-bold tabular-nums text-muted-foreground">
                    {concept.masteryScore}%
                  </span>
                </div>
                <MaterialLevelsView
                  conceptId={concept.id}
                  existingMaterials={concept.materials}
                />
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
