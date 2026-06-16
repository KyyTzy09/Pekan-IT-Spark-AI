"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { InviteManager } from "@/components/student/invite-manager";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface InviteData {
  studentName: string | null;
  activeInvite: {
    inviteCode: string;
    expiresAt: string;
    status: "PENDING";
    createdAt: string;
  } | null;
  history: Array<{
    inviteCode: string;
    expiresAt: string;
    status: "PENDING" | "ACCEPTED";
    parentName: string | null;
    parentEmail: string | null;
    createdAt: string;
  }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Button
        asChild
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-xl"
      >
        <Link href="/dashboard">
          <ArrowLeft size={14} />
          Kembali ke beranda
        </Link>
      </Button>

      <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
          }}
        />
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
          <Heart size={10} strokeWidth={2.5} />
          Orang tua
        </span>
        <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
          Undang orang tua kamu
        </h1>
        <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
          Buat kode undangan biar orang tuamu bisa pantau perkembangan belajarmu
          — tanpa bisa ngubah progress kamu.
        </p>
      </header>

      <div className="space-y-3">
        <div className="h-40 animate-pulse rounded-2xl border border-border/40 bg-card/50" />
        <div className="h-32 animate-pulse rounded-2xl border border-border/40 bg-card/50" />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--green)] text-white">
          <Sparkles size={15} strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-heading text-[13.5px] font-bold text-foreground">
            Orang tua = pengguna pendukung
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/80">
            Mereka cuma bisa liat ringkasan perkembangamu. Nggak bisa edit,
            hapus data, atau interaksi langsung sama Spark.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  const { data, isLoading, error } = useQuery<InviteData>({
    queryKey: ["settings", "invite"],
    queryFn: async () => {
      const res = await fetch("/api/settings/invite");
      if (!res.ok) throw new Error("Gagal memuat data undangan");
      return res.json();
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Gagal memuat data. Coba muat ulang halaman.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        asChild
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-xl"
      >
        <Link href="/dashboard">
          <ArrowLeft size={14} />
          Kembali ke beranda
        </Link>
      </Button>

      <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
          }}
        />
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
          <Heart size={10} strokeWidth={2.5} />
          Orang tua
        </span>
        <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
          Undang orang tua kamu
        </h1>
        <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
          Buat kode undangan biar orang tuamu bisa pantau perkembangan belajarmu
          — tanpa bisa ngubah progress kamu.
        </p>
      </header>

      <InviteManager
        studentName={data?.studentName ?? null}
        activeInvite={data?.activeInvite ?? null}
        history={data?.history ?? []}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--green)] text-white">
          <Sparkles size={15} strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-heading text-[13.5px] font-bold text-foreground">
            Orang tua = pengguna pendukung
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/80">
            Mereka cuma bisa liat ringkasan perkembangamu. Nggak bisa edit,
            hapus data, atau interaksi langsung sama Spark.
          </p>
        </div>
      </div>
    </div>
  );
}
