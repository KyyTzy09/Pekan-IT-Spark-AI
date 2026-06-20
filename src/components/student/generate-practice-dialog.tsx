"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function GeneratePracticeDialog({
  open,
  onClose,
  subjects,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  onGenerate: (subjectId: string, count: number) => Promise<void>;
}) {
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(
    null,
  );
  const [count, setCount] = React.useState(5);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    try {
      await onGenerate(selectedSubject, count);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isGenerating) onClose();
      }}
    >
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-card border border-border/40"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-border/40 border-b p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
              Generate Soal
            </p>
            <DialogTitle className="mt-1 font-heading text-[18px] font-bold">
              Pilih Mapel
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-border/40 bg-background/60 text-muted-foreground"
          >
            <X size={14} />
          </button>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubject(s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  selectedSubject === s.id
                    ? "border-[var(--purple)]/40 bg-[var(--purple)]/8 ring-1 ring-[var(--purple)]/30"
                    : "border-border/30 bg-background/40 hover:border-border/60",
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-white"
                  style={{
                    background: s.color
                      ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                      : "linear-gradient(135deg, var(--coral), var(--orange))",
                  }}
                >
                  <span className="text-[14px]">{s.icon ?? "📚"}</span>
                </span>
                <span className="text-[12px] font-semibold text-foreground truncate">
                  {s.name}
                </span>
              </button>
            ))}
          </div>

          {selectedSubject && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Jumlah Soal: {count}
              </label>
              <input
                type="range"
                min={3}
                max={15}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-[var(--purple)]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3</span>
                <span>15</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedSubject || isGenerating}
            className="w-full rounded-xl bg-[var(--purple)] text-white font-bold"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate {count} Soal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
