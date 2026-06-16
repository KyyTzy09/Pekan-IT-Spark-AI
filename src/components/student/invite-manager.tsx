"use client";

import {
  Check,
  Copy,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateInvite, revokeInvite } from "@/server/actions/invite";
import type { LinkStatus } from "../../../generated/prisma/client";

type Invite = {
  inviteCode: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED";
  parentName: string | null;
  parentEmail: string | null;
  createdAt: string;
};

type ActiveInvite = {
  inviteCode: string;
  expiresAt: string;
  status: LinkStatus;
  createdAt: string;
};

export function InviteManager({
  studentName,
  activeInvite,
  history,
}: {
  studentName: string | null;
  activeInvite: ActiveInvite | null;
  history: Invite[];
}) {
  const router = useRouter();
  const [working, setWorking] = React.useState<"generate" | "revoke" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async () => {
    setWorking("generate");
    setError(null);
    const result = await generateInvite();
    setWorking(null);
    if (!result.ok) {
      setError("Gagal membuat kode. Coba lagi, ya.");
      return;
    }
    router.refresh();
  };

  const handleRevoke = async () => {
    if (!activeInvite) return;
    const ok = window.confirm(
      "Yakin mau batalin kode ini? Orang tuamu nggak akan bisa pakai kode ini lagi.",
    );
    if (!ok) return;
    setWorking("revoke");
    setError(null);
    const result = await revokeInvite();
    setWorking(null);
    if (!result.ok) {
      setError("Gagal membatalkan kode. Coba lagi, ya.");
      return;
    }
    router.refresh();
  };

  const handleCopy = async () => {
    if (!activeInvite) return;
    try {
      await navigator.clipboard.writeText(activeInvite.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin. Coba salin manual, ya.");
    }
  };

  const expiresIn = activeInvite
    ? getRemainingTime(activeInvite.expiresAt)
    : null;

  return (
    <div className="mt-7 space-y-5">
      {activeInvite ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
                <Sparkles size={16} strokeWidth={2.5} />
              </span>
              <div className="flex-1">
                <p className="font-heading text-[14px] font-bold text-foreground">
                  Kode undangan kamu
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  Kasih kode ini ke orang tuamu. Mereka tinggal masukin di
                  halaman daftar / hubungkan akun.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-dashed border-[var(--coral)]/40 bg-[var(--coral)]/5 px-4 py-3.5 text-center">
                <span className="font-heading text-[28px] font-bold tracking-[0.18em] text-[var(--coral)] sm:text-[32px]">
                  {activeInvite.inviteCode}
                </span>
              </div>
              <Button
                type="button"
                size="icon-lg"
                variant="outline"
                onClick={handleCopy}
                aria-label="Salin kode"
                className="rounded-2xl"
              >
                {copied ? (
                  <Check size={16} className="text-[var(--teal)]" />
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>

            {expiresIn && (
              <p className="mt-3 text-center text-[11.5px] font-medium text-muted-foreground">
                Berlaku sampai {expiresIn} • Maks 7 hari sejak dibuat
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleRevoke}
                disabled={working !== null}
                className="rounded-2xl"
              >
                {working === "revoke" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Batalkan kode
              </Button>
              <p className="flex-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Belum ada yang pakai? Boleh dibatalin dan bikin ulang kapan aja.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/40 bg-card/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white">
              <Users size={16} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-heading text-[14px] font-bold text-foreground">
                Belum ada kode aktif
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                Buat kode dulu, lalu kasih ke orang tuamu. Kode berlaku 7 hari
                dan cuma bisa dipakai 1x.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={working !== null}
            className="mt-4 w-full rounded-2xl bg-[var(--coral)] text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 sm:w-auto"
          >
            {working === "generate" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} />
            )}
            Buat kode undangan
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
        >
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
          {error}
        </div>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="font-heading text-[14px] font-bold text-foreground">
            Riwayat undangan
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Daftar kode yang pernah kamu buat dan statusnya.
          </p>
          <ul className="mt-3 space-y-2">
            {history.map((h) => (
              <li
                key={h.inviteCode}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 p-3.5"
              >
                <div className="min-w-0">
                  <span className="font-heading text-[14px] font-bold tracking-[0.12em] text-foreground">
                    {h.inviteCode}
                  </span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {h.parentName ? ` • ${h.parentName}` : ""}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Halo, {studentName ?? "Teman"} 👋
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "ACCEPTED" }) {
  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-[var(--teal)]">
        <Check size={10} strokeWidth={3} />
        Terhubung
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest",
        "border border-[var(--yellow)]/30 bg-[color-mix(in_oklch,var(--yellow)_8%,transparent)] text-[var(--yellow)]",
      )}
    >
      <Loader2 size={10} strokeWidth={3} className="animate-spin-slow" />
      Pending
    </span>
  );
}

function getRemainingTime(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "sudah kedaluwarsa";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  return `${hours} jam lagi`;
}
