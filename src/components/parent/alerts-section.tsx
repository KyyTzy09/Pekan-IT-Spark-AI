"use client";

import { AlertCircle, Brain, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "inactivity" | "struggle" | "info";
  title: string;
  message: string;
  severity: "info" | "warning";
}

export function AlertsSection({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-[12.5px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <AlertCircle size={13} className="text-muted-foreground" />
        Notifikasi Perkembangan
      </h2>
      <div className="grid gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4.5 flex gap-3.5 backdrop-blur-xl shadow-sm",
              alert.severity === "warning"
                ? "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-100"
                : "border-[var(--blue)]/20 bg-[var(--blue)]/5 text-[var(--blue)]"
            )}
          >
            <div
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
                alert.severity === "warning"
                  ? "bg-amber-500"
                  : "bg-gradient-to-br from-[var(--blue)] to-[var(--teal)]"
              )}
            >
              {alert.type === "inactivity" ? (
                <Calendar size={15} strokeWidth={2.5} />
              ) : alert.type === "struggle" ? (
                <Brain size={15} strokeWidth={2.5} />
              ) : (
                <Sparkles size={15} strokeWidth={2.5} />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-[13px] font-bold tracking-tight">
                {alert.title}
              </h3>
              <p className="text-[12px] leading-relaxed text-muted-foreground max-w-2xl">
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
