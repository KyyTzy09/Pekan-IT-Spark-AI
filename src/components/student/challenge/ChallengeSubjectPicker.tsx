"use client";

import { Check, Loader2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  setChallengeSubjects,
  setWeeklyChallengeSubjects,
} from "@/server/actions/challenge-subjects";

export type SubjectPickerVariant = "daily" | "weekly";

export type SubjectOption = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  avgMastery: number | null;
  isCustom: boolean;
};

interface ChallengeSubjectPickerProps {
  open: boolean;
  onClose: () => void;
  variant: SubjectPickerVariant;
  currentSubjectIds: string[];
  availableSubjects: SubjectOption[];
}

export function ChallengeSubjectPicker({
  open,
  onClose,
  variant,
  currentSubjectIds,
  availableSubjects,
}: ChallengeSubjectPickerProps) {
  const [selected, setSelected] = React.useState<string[]>(currentSubjectIds);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setSelected(currentSubjectIds);
      setError(null);
    }
  }, [open, currentSubjectIds]);

  if (!open) return null;

  const toggle = (id: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) {
        setError("Maksimal 4 mapel");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError("Pilih minimal 1 mapel");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const action =
        variant === "daily" ? setChallengeSubjects : setWeeklyChallengeSubjects;
      const res = await action({ subjectIds: selected });
      if (res.ok) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const title =
    variant === "daily"
      ? "Pilih mapel untuk tantangan hari ini"
      : "Pilih mapel untuk tantangan mingguan";
  const subtitle =
    variant === "daily"
      ? "Maksimal 4 mapel. Berlaku mulai besok kalau tantangan hari ini sudah dibuat."
      : "Maksimal 4 mapel. Berlaku mulai minggu depan kalau tantangan minggu ini sudah dibuat.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-border/40 bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/30 p-5 sm:p-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[18px] font-bold leading-tight">
              {title}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
          {availableSubjects.length === 0 ? (
            <p className="text-center text-[12.5px] text-muted-foreground">
              Tidak ada mapel tersedia. Tambahkan mapel dulu di halaman Mata
              Pelajaran.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {availableSubjects.map((s) => {
                const isSelected = selected.includes(s.id);
                const isDisabled = !isSelected && selected.length >= 4;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    disabled={isDisabled}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-[var(--coral)] bg-[var(--coral)]/10 shadow-[0_4px_10px_rgba(225,29,72,0.15)]"
                        : "border-border/40 bg-card/60 hover:border-[var(--coral)]/30",
                      isDisabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-base shadow-sm"
                      style={{
                        background: s.color
                          ? `color-mix(in oklch, ${s.color} 12%, transparent)`
                          : "var(--muted)",
                      }}
                    >
                      {s.icon ?? "📚"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{s.name}</p>
                      {s.avgMastery !== null && (
                        <p className="text-[10px] text-muted-foreground">
                          Mastery {Math.round(s.avgMastery * 100)}%
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/30 p-5 sm:p-6">
          <p className="text-[11.5px] font-bold text-muted-foreground">
            {selected.length}/4 dipilih
          </p>
          <div className="flex items-center gap-2">
            {error && (
              <p className="text-[11px] font-bold text-destructive">{error}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || selected.length === 0}
              className="rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--purple)] text-white"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
