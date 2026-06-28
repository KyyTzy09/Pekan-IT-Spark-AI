"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getMyQuota, type QuotaStatus } from "@/server/actions/quota";

function getQuotaColor(used: number, limit: number): string {
  const pct = used / limit;
  if (pct >= 0.9) return "text-red-500";
  if (pct >= 0.7) return "text-amber-500";
  return "text-emerald-500";
}

function getProgressBarColor(used: number, limit: number): string {
  const pct = used / limit;
  if (pct >= 0.9) return "[&>div]:bg-red-400";
  if (pct >= 0.7) return "[&>div]:bg-amber-400";
  return "[&>div]:bg-emerald-400";
}

function formatResetTime(resetAt: string): string {
  const now = new Date();
  const reset = new Date(resetAt);
  const diffMs = reset.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}

export function QuotaDisplay({ className }: { className?: string }) {
  const [quotas, setQuotas] = useState<QuotaStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyQuota()
      .then(setQuotas)
      .finally(() => setLoading(false));
  }, []);

  if (loading || quotas.length === 0) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-4 shadow-[0_4px_16px_rgba(80,20,50,0.04)] backdrop-blur-md sm:p-5",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.80 0.16 85 / 0.5), transparent 70%)",
        }}
      />

      <header className="relative mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-amber-400/15 to-orange-400/15 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
          <Zap size={14} className="text-amber-500" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Kuota Hari Ini
          </p>
          <p className="text-[10px] text-muted-foreground">
            Reset dalam {formatResetTime(quotas[0].resetAt)}
          </p>
        </div>
      </header>

      <div className="relative grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {quotas.map((q) => {
          const pct = Math.min((q.used / q.limit) * 100, 100);
          const colorClass = getQuotaColor(q.used, q.limit);
          const barClass = getProgressBarColor(q.used, q.limit);

          return (
            <div key={q.kind} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {q.icon} {q.label}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-bold tabular-nums",
                    colorClass,
                  )}
                >
                  {q.used}/{q.limit}
                </span>
              </div>
              <Progress
                value={pct}
                className={cn("h-1.5 rounded-full bg-border/50", barClass)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
