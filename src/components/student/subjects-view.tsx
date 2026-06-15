import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Layers,
  Lock,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SubjectExplorerSummary } from "@/server/actions/dashboard";

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
  const official = subjects.filter((s) => !s.isCustom);
  const custom = subjects.filter((s) => s.isCustom);
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
                dipelajari, dan progress konstelasi kamu. Topik yang kamu pilih
                pas onboarding bakal muncul di urutan atas.
              </p>
            </div>
            {addAction}
          </div>
        </header>
      </Reveal>

      {official.length > 0 && (
        <Reveal delay={80}>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {official.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                isFocused={focusedIds.includes(s.id)}
              />
            ))}
          </div>
        </Reveal>
      )}

      {custom.length > 0 && (
        <Reveal delay={120}>
          <section>
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  Mapel kamu
                </p>
                <h2 className="mt-0.5 font-heading text-[16px] font-bold leading-tight">
                  Custom + AI
                </h2>
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
}: {
  subject: SubjectListItem;
  isFocused: boolean;
}) {
  return (
    <Link
      href={`/subjects/${subject.slug.toLowerCase()}`}
      className="group/sub relative overflow-hidden rounded-2xl border border-border/40 bg-card/85 p-5 shadow-[0_8px_22px_rgba(80,20,50,0.06)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(80,20,50,0.14)]"
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
                title="Mapel ini dibuat pakai Spark AI"
              >
                <Wand2 size={8} strokeWidth={2.5} />
                AI
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
    </Link>
  );
}

export function SubjectDetailView({
  summary,
}: {
  summary: SubjectExplorerSummary;
}) {
  const { subject, topics, totalConcepts, masteredConcepts } = summary;
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Mata pelajaran
              </p>
              <h1 className="mt-1 font-heading text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                  {subject.description}
                </p>
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
    </div>
  );
}

function Constellation({
  concepts,
}: {
  concepts: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
    masteryScore: number;
  }>;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-[oklch(0.16_0.04_260)] via-[oklch(0.18_0.04_280)] to-[oklch(0.2_0.05_300)] p-5 shadow-[0_12px_36px_rgba(20,10,50,0.18)] sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {concepts.map((c, i) => {
          const mastered = c.status === "MASTERED";
          const learning = c.status === "LEARNING";
          const struggling = c.status === "STRUGGLING";
          const masteryPct = Math.round(c.masteryScore * 100);
          return (
            <Link
              key={c.id}
              href={`/practice?concept=${c.id}`}
              className={cn(
                "group/cs relative overflow-hidden rounded-2xl border p-3 backdrop-blur-md transition-all hover:-translate-y-0.5",
                mastered
                  ? "border-[var(--yellow)]/40 bg-[color-mix(in_oklch,var(--yellow)_10%,transparent)] shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                  : learning
                    ? "border-[var(--teal)]/40 bg-[color-mix(in_oklch,var(--teal)_10%,transparent)]"
                    : struggling
                      ? "border-[var(--coral)]/40 bg-[color-mix(in_oklch,var(--coral)_10%,transparent)]"
                      : "border-white/10 bg-white/5",
              )}
              style={{
                animation: mastered
                  ? `pulse-soft 4s ease-in-out ${(i % 6) * 0.4}s infinite`
                  : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-white shadow-[0_0_12px_rgba(255,255,255,0.18)]",
                    mastered
                      ? "bg-gradient-to-br from-[var(--yellow)] to-[var(--orange)]"
                      : learning
                        ? "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)]"
                        : struggling
                          ? "bg-gradient-to-br from-[var(--coral)] to-[var(--pink)]"
                          : "bg-white/15",
                  )}
                >
                  <Star
                    size={12}
                    fill={mastered ? "currentColor" : "none"}
                    className={cn(mastered ? "text-white" : "text-white/70")}
                    strokeWidth={2.5}
                  />
                </span>
                <span className="font-heading text-[11px] font-bold tabular-nums text-white/90">
                  {masteryPct}%
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug text-white">
                {c.name}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                {c.status === "MASTERED"
                  ? "Dikuasai"
                  : c.status === "LEARNING"
                    ? "Lagi dipelajari"
                    : c.status === "STRUGGLING"
                      ? "Butuh bantuan"
                      : "Belum mulai"}
              </p>
              <ArrowUpRight
                size={12}
                className="absolute right-2 bottom-2 text-white/40 transition-transform group-hover/cs:translate-x-0.5 group-hover/cs:-translate-y-0.5 group-hover/cs:text-white/80"
              />
            </Link>
          );
        })}
      </div>
      {concepts.length === 0 && (
        <p className="relative text-center text-[12.5px] text-white/70">
          Belum ada konsep di topik ini.
        </p>
      )}
    </div>
  );
}
