"use client";

import { ArrowLeft, Calendar, History } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { ChallengeCard } from "@/components/student/challenge/challenge-card";
import { Button } from "@/components/ui/button";

type ChallengeStatus = "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
type ChallengeSource = "AUTO_DAILY" | "ON_DEMAND";

interface ChallengeListItem {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  source: ChallengeSource;
  scheduledFor: string;
  completedAt: string | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  itemCount: number;
  completedItemCount: number;
  totalPoints: number;
  mixConfig: { questions: number; materials: number; reflections: number };
}

interface HistoryResult {
  items: ChallengeListItem[];
  total: number;
}

export function ChallengeHistoryView({
  initialResult,
}: {
  initialResult: HistoryResult;
}) {
  const [result, setResult] = React.useState<HistoryResult>(initialResult);
  const [loading, setLoading] = React.useState(false);
  const [offset, setOffset] = React.useState(50);

  const grouped = React.useMemo(() => {
    const map = new Map<string, ChallengeListItem[]>();
    for (const item of result.items) {
      const date = new Date(item.scheduledFor);
      const key = date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      const list = map.get(key);
      if (list) list.push(item);
    }
    return Array.from(map.entries());
  }, [result.items]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/challenge/history?limit=50&offset=${offset}`,
      );
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

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.65 0.18 280 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                <History size={10} strokeWidth={2.5} />
                Riwayat
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight sm:text-[28px]">
                Riwayat Tantangan
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
                {result.total} tantangan tersimpan. Mau ulangi atau lihat lagi
                materi dari tantangan sebelumnya.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/challenge">
                <ArrowLeft size={13} />
                Hari ini
              </Link>
            </Button>
          </div>
        </header>
      </Reveal>

      {grouped.length === 0 ? (
        <Reveal delay={80}>
          <div className="rounded-3xl border border-border/40 bg-card/80 p-8 text-center shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md">
            <Calendar size={28} className="mx-auto text-muted-foreground" />
            <p className="mt-3 font-heading text-[16px] font-bold">
              Belum ada riwayat
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Mulai dengan ngerjain tantangan hari ini.
            </p>
            <Button
              asChild
              className="mt-4 h-9 rounded-full bg-[var(--purple)] text-white"
            >
              <Link href="/challenge">Lihat tantangan hari ini</Link>
            </Button>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items], gIdx) => (
            <Reveal key={date} delay={gIdx * 40}>
              <section>
                <h2 className="mb-2.5 font-heading text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                  {date}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} />
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
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
        </div>
      )}
    </div>
  );
}
