"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { UploadView } from "@/components/student/upload-view";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function SkeletonCard() {
  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
          <div className="mt-3 h-7 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/70 p-6 text-center sm:p-10">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted animate-pulse" />
          <div className="mt-4 h-5 w-40 mx-auto animate-pulse rounded-lg bg-muted" />
          <div className="mt-1 h-4 w-56 mx-auto animate-pulse rounded-lg bg-muted" />
        </div>
      </Reveal>
      <Reveal delay={120}>
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-5 w-36 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <ul className="grid gap-2.5">
            {[1, 2, 3].map((i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/80 p-3.5"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="flex gap-1.5">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}

export default function UploadPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (res.status === 401) return { unauthorized: true } as const;
      if (!res.ok) throw new Error("Gagal memuat dokumen.");
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) return <SkeletonCard />;

  if (error || !data || "unauthorized" in data) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.15 175 / 0.5), transparent 70%)",
              }}
            />
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
              <BookOpen size={10} strokeWidth={2.5} />
              Upload materi
            </span>
            <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
              Login dulu yuk
            </h1>
            <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
              Asistensi materi khusus buat siswa Spark. Masuk dulu biar bisa
              upload PDF/DOCX dari guru kamu.
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/auth/login">
                  <ArrowLeft size={13} />
                  Masuk
                </Link>
              </Button>
            </div>
          </header>
        </Reveal>
      </div>
    );
  }

  const initial = data.ok ? data.documents : [];

  return <UploadView initialDocuments={initial} />;
}
