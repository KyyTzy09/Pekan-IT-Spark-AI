"use client";

import {
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Heart,
  Loader2,
  Search,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSubjectFavorite } from "@/server/actions/subjects";

type SubjectItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  isCustom: boolean;
  source: string;
  totalConcepts: number;
  averageMastery: number;
  mastered: number;
  isFavorite: boolean;
};

export function SubjectsManageView({
  subjects,
  focusedIds,
}: {
  subjects: SubjectItem[];
  focusedIds: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const filtered = query
    ? subjects.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : subjects;

  const favorites = filtered.filter((s) => focusedIds.includes(s.id));
  const others = filtered.filter((s) => !focusedIds.includes(s.id));

  const handleToggle = async (subjectId: string) => {
    setPendingId(subjectId);
    try {
      const result = await toggleSubjectFavorite({ subjectId });
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Gagal mengubah favorit");
      }
    } catch {
      alert("Gagal mengubah favorit");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-xl"
          >
            <Link href="/subjects">
              <ChevronLeft size={20} />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              Kelola
            </p>
            <h1 className="font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
              Mata Pelajaran Favorit
            </h1>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Pilih mata pelajaran yang kamu sukai. Minimal 1 mapel harus dipilih.
          Mapel favorit akan mendapat tantangan harian dan mingguan.
        </p>
      </header>

      {/* Search */}
      <div className="relative flex items-center rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
        <span className="grid size-10 place-items-center text-muted-foreground">
          <Search size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari mata pelajaran..."
          className="h-11 w-full min-w-0 rounded-2xl bg-transparent pr-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80"
        />
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <header className="mb-3 flex items-center gap-2 px-1">
            <Heart
              size={14}
              className="fill-[var(--coral)] text-[var(--coral)]"
            />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              Favorit kamu ({favorites.length})
            </p>
          </header>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {favorites.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                isFavorite={true}
                isPending={pendingId === s.id}
                onToggle={() => handleToggle(s.id)}
                canRemove={focusedIds.length > 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Others */}
      {others.length > 0 && (
        <section>
          <header className="mb-3 flex items-center gap-2 px-1">
            <CircleDashed size={14} className="text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tersedia ({others.length})
            </p>
          </header>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {others.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                isFavorite={false}
                isPending={pendingId === s.id}
                onToggle={() => handleToggle(s.id)}
                canRemove={true}
              />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-border/40 bg-card/50 p-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            Tidak ada mata pelajaran ditemukan.
          </p>
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  isFavorite,
  isPending,
  onToggle,
  canRemove,
}: {
  subject: SubjectItem;
  isFavorite: boolean;
  isPending: boolean;
  onToggle: () => void;
  canRemove: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all",
        isFavorite
          ? "border-[var(--coral)]/30 bg-[var(--coral)]/5"
          : "border-border/40 bg-card/60",
        isPending && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          style={{
            background: subject.color
              ? `linear-gradient(135deg, ${subject.color}, oklch(0.65 0.15 60))`
              : "linear-gradient(135deg, var(--coral), var(--orange))",
          }}
        >
          <span className="text-[16px]">{subject.icon ?? "📚"}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-[14px] font-bold text-foreground truncate">
              {subject.name}
            </h3>
            {subject.isCustom && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--purple)]/8 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[var(--purple)]">
                <Wand2 size={7} strokeWidth={2.5} />
                AI
              </span>
            )}
          </div>
          {subject.description && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {subject.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <CircleDashed size={9} />
              {subject.totalConcepts} konsep
            </span>
            <span>{subject.averageMastery}%</span>
            {subject.mastered > 0 && (
              <span className="flex items-center gap-0.5 text-[var(--teal)]">
                <CheckCircle2 size={9} />
                {subject.mastered}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg"
          onClick={onToggle}
          disabled={isPending || (isFavorite && !canRemove)}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Heart
              size={14}
              className={cn(
                isFavorite
                  ? "fill-[var(--coral)] text-[var(--coral)]"
                  : "text-muted-foreground",
              )}
            />
          )}
        </Button>
      </div>
    </div>
  );
}
