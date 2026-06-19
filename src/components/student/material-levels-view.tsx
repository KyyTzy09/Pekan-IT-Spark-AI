"use client";

import { Check, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addAdvancedMaterial } from "@/server/actions/add-layered-material";

type MaterialLevel = {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  label: string;
  exists: boolean;
};

const LEVELS: Omit<MaterialLevel, "exists">[] = [
  { difficulty: "EASY", label: "Materi Dasar" },
  { difficulty: "MEDIUM", label: "Materi Menengah" },
  { difficulty: "HARD", label: "Materi Lanjutan" },
];

export function MaterialLevelsView({
  conceptId,
  existingMaterials,
}: {
  conceptId: string;
  existingMaterials: Array<{ difficulty: string; id: string }>;
}) {
  const [loadingLevel, setLoadingLevel] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const levels: MaterialLevel[] = LEVELS.map((l) => ({
    ...l,
    exists: existingMaterials.some((m) => m.difficulty === l.difficulty),
  }));

  const handleAdd = async (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    setLoadingLevel(difficulty);
    setError(null);
    try {
      const result = await addAdvancedMaterial({ conceptId, difficulty });
      if (!result.ok) {
        setError(result.error || "Gagal generate materi");
      }
    } catch {
      setError("Gagal generate materi");
    } finally {
      setLoadingLevel(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Level Materi
      </p>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <Button
            key={level.difficulty}
            variant="outline"
            size="sm"
            onClick={() => handleAdd(level.difficulty)}
            disabled={level.exists || loadingLevel !== null}
            className={cn(
              "rounded-full text-[11px] font-bold",
              level.exists && "bg-[var(--teal)]/10 border-[var(--teal)]/30 text-[var(--teal)]",
            )}
          >
            {loadingLevel === level.difficulty ? (
              <Loader2 size={12} className="animate-spin" />
            ) : level.exists ? (
              <Check size={12} />
            ) : (
              <Plus size={12} />
            )}
            {level.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
