"use client";

import { gooeyToast } from "goey-toast";
import { Loader2, Lock, Sparkles, Wand2 } from "lucide-react";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getAvatarCustomizationAction,
  updateAvatarCustomizationAction,
} from "@/server/actions/gamification";

type OptionState = {
  color: string;
  accessory: string;
  background: string;
};

const COLOR_OPTIONS = [
  { id: "default", name: "Classic Orange", css: "bg-orange-500", xp: 0 },
  { id: "blue", name: "Spark Blue", css: "bg-cyan-500", xp: 0 },
  { id: "green", name: "Forest Green", css: "bg-emerald-500", xp: 200 },
  { id: "purple", name: "Cosmic Purple", css: "bg-violet-500", xp: 400 },
  { id: "gold", name: "Royal Gold", css: "bg-amber-400", xp: 800 },
];

const ACCESSORY_OPTIONS = [
  { id: "none", name: "Tanpa Aksesoris", emoji: "❌", xp: 0 },
  { id: "glasses", name: "Nerd Glasses", emoji: "👓", xp: 300 },
  { id: "ribbon", name: "Cute Ribbon", emoji: "🎀", xp: 400 },
  { id: "hat", name: "Graduation Cap", emoji: "🎓", xp: 500 },
  { id: "crown", name: "Golden Crown", emoji: "👑", xp: 1000 },
];

const BACKGROUND_OPTIONS = [
  { id: "default", name: "Classic Warm", desc: "Red/Orange glow", xp: 0 },
  { id: "aurora", name: "Northern Glow", desc: "Green/Purple light", xp: 250 },
  { id: "space", name: "Deep Galaxy", desc: "Deep space darkness", xp: 500 },
  { id: "neon", name: "Cyber Neon", desc: "Pink/Cyan neon aura", xp: 750 },
];

export function AvatarCustomizerWidget({ totalXp }: { totalXp: number }) {
  const [current, setCurrent] = React.useState<OptionState>({
    color: "default",
    accessory: "none",
    background: "default",
  });
  const [preview, setPreview] = React.useState<OptionState>({
    color: "default",
    accessory: "none",
    background: "default",
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (dialogOpen) {
      setError(null);
    }
  }, [dialogOpen]);

  React.useEffect(() => {
    getAvatarCustomizationAction().then((res) => {
      if (res.ok && res.avatar) {
        const val = {
          color: res.avatar.color,
          accessory: res.avatar.accessory || "none",
          background: res.avatar.background || "default",
        };
        setCurrent(val);
        setPreview(val);
      }
      setLoading(false);
    });
  }, [dialogOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updateAvatarCustomizationAction(
        preview.color,
        preview.accessory,
        preview.background,
      );
      if (res.ok) {
        setCurrent(preview);
        setDialogOpen(false);
        gooeyToast.success("Karakter berhasil diubah!");
      } else {
        const errMsg = res.error || "Gagal menyimpan kustomisasi.";
        setError(errMsg);
        gooeyToast.error(errMsg);
      }
    } catch {
      setError("Gagal menghubungi server.");
      gooeyToast.error("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !current) {
    return (
      <div className="flex h-44 items-center justify-center rounded-3xl border border-border/40 bg-card/60 p-5 shadow-md">
        <Loader2 className="animate-spin text-[var(--purple)]" size={20} />
      </div>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent p-5 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-purple-500/10 blur-2xl"
      />

      <div className="relative flex items-center gap-4">
        {/* Mascot Avatar view */}
        <div className="shrink-0">
          <SparkCharacter
            size="md"
            color={current.color}
            accessory={current.accessory}
            background={current.background}
          />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200/50 bg-purple-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            <Wand2 size={9} />
            Mascot Spark
          </span>
          <h3 className="mt-2 font-heading text-[15px] font-bold text-foreground">
            Kustomisasi Karakter
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Dandani maskot Spark kamu dengan style favoritmu sesuai pencapaian
            belajarmu!
          </p>
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="xs"
              className="w-full rounded-full text-[10px] py-1 h-7 bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Sparkles size={11} className="mr-1" />
              Sesuaikan Tampilan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl p-5 overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="font-heading text-base font-bold">
                Kustomisasi Maskot Spark
              </DialogTitle>
            </DialogHeader>

            {/* Live Preview Container */}
            <div className="my-5 flex flex-col items-center justify-center rounded-2xl bg-muted/30 p-4 border border-border/20">
              <SparkCharacter
                size="lg"
                color={preview.color}
                accessory={preview.accessory}
                background={preview.background}
              />
              <p className="mt-3 text-[10.5px] font-semibold text-muted-foreground">
                Pratinjau Spark
              </p>
            </div>

            {error && (
              <p className="mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <div className="space-y-4">
              {/* Color options */}
              <div>
                <h4 className="text-[11.5px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Warna Dasar
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((o) => {
                    const isLocked = totalXp < o.xp;
                    const isSelected = preview.color === o.id;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          !isLocked &&
                          setPreview((p) => ({ ...p, color: o.id }))
                        }
                        disabled={isLocked}
                        className={cn(
                          "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-medium transition-all",
                          isSelected
                            ? "border-purple-500 bg-purple-500/5 text-purple-600 font-bold"
                            : isLocked
                              ? "border-muted bg-muted/40 text-muted-foreground/60 cursor-not-allowed opacity-60"
                              : "border-border bg-background hover:bg-muted/50 text-foreground/80",
                        )}
                      >
                        <span className={cn("size-2 rounded-full", o.css)} />
                        <span>{o.name}</span>
                        {isLocked && (
                          <Lock
                            size={9}
                            className="ml-0.5 text-muted-foreground"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accessory options */}
              <div>
                <h4 className="text-[11.5px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Aksesoris
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ACCESSORY_OPTIONS.map((o) => {
                    const isLocked = totalXp < o.xp;
                    const isSelected = preview.accessory === o.id;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          !isLocked &&
                          setPreview((p) => ({ ...p, accessory: o.id }))
                        }
                        disabled={isLocked}
                        className={cn(
                          "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-medium transition-all",
                          isSelected
                            ? "border-purple-500 bg-purple-500/5 text-purple-600 font-bold"
                            : isLocked
                              ? "border-muted bg-muted/40 text-muted-foreground/60 cursor-not-allowed opacity-60"
                              : "border-border bg-background hover:bg-muted/50 text-foreground/80",
                        )}
                      >
                        <span>{o.emoji}</span>
                        <span>{o.name}</span>
                        {isLocked && (
                          <Lock
                            size={9}
                            className="ml-0.5 text-muted-foreground"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background glow options */}
              <div>
                <h4 className="text-[11.5px] font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Aura Glow
                </h4>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUND_OPTIONS.map((o) => {
                    const isLocked = totalXp < o.xp;
                    const isSelected = preview.background === o.id;

                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          !isLocked &&
                          setPreview((p) => ({ ...p, background: o.id }))
                        }
                        disabled={isLocked}
                        className={cn(
                          "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-medium transition-all",
                          isSelected
                            ? "border-purple-500 bg-purple-500/5 text-purple-600 font-bold"
                            : isLocked
                              ? "border-muted bg-muted/40 text-muted-foreground/60 cursor-not-allowed opacity-60"
                              : "border-border bg-background hover:bg-muted/50 text-foreground/80",
                        )}
                      >
                        <span>{o.name}</span>
                        {isLocked && (
                          <Lock
                            size={9}
                            className="ml-0.5 text-muted-foreground"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-full text-xs"
                size="sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-purple-500 text-white hover:bg-purple-600 text-xs font-bold px-4"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Tampilan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}
