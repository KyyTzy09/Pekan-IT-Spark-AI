"use client";

import { Clock, Sparkles, Zap } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuotaExhaustedModalProps {
  open: boolean;
  onClose: () => void;
  quotaType: string;
}

function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
}

export function QuotaExhaustedModal({
  open,
  onClose,
  quotaType,
}: QuotaExhaustedModalProps) {
  const [resetTime, setResetTime] = React.useState(getTimeUntilReset());

  React.useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setResetTime(getTimeUntilReset());
    }, 60_000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-lg shadow-[var(--coral)]/25 mb-3">
            <Zap size={28} strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-center font-heading text-[20px] font-bold">
            Kuota Harian Habis
          </DialogTitle>
          <DialogDescription className="text-center text-[13px] leading-relaxed">
            Kamu sudah menggunakan semua kuota <strong>{quotaType}</strong> hari
            ini. Kuota akan di-reset otomatis besok pagi.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--purple)]/10 text-[var(--purple)]">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Reset dalam
              </p>
              <p className="font-heading text-[18px] font-bold text-foreground">
                {resetTime}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--teal)]/20 bg-[var(--teal)]/5 p-3">
          <div className="flex items-start gap-2">
            <Sparkles
              size={14}
              className="mt-0.5 shrink-0 text-[var(--teal)]"
            />
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Tip: Kuota di-reset setiap hari jam 00:00 UTC. Manfaatkan kuota
              yang ada dengan memilih konsep yang paling ingin kamu pelajari.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] font-bold text-white shadow-lg shadow-[var(--coral)]/25"
          >
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
