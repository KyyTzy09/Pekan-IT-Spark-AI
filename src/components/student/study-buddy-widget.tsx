"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplet, Sprout, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getStudyBuddyAction, updateStudyBuddyAction } from "@/server/actions/gamification";
import { cn } from "@/lib/utils";

type BuddyData = {
  type: string;
  stage: number;
};

const BUDDY_TYPES = [
  { id: "bunga", name: "Bunga Melati", emoji: "🌸", desc: "Cantik, harum, dan suka kebersihan belajarmu." },
  { id: "kaktus", name: "Kaktus Gurun", emoji: "🌵", desc: "Tangguh dan mandiri, lambang ketekunan tanpa batas." },
  { id: "bonsai", name: "Bonsai Mini", emoji: "🪴", desc: "Estetik dan filosofis, butuh konsistensi tinggi." },
  { id: "beringin", name: "Pohon Beringin", emoji: "🌳", desc: "Kokoh menaungi, lambang ilmu yang sangat luas." },
];

export function StudyBuddyWidget({ streak }: { streak: number }) {
  const [buddy, setBuddy] = React.useState<BuddyData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [watering, setWatering] = React.useState(false);
  const [waterMsg, setWaterMsg] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    getStudyBuddyAction().then((res) => {
      if (res.ok && res.buddy) {
        setBuddy({
          type: res.buddy.type,
          stage: res.buddy.stage,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSelectBuddy = async (type: string) => {
    setLoading(true);
    const res = await updateStudyBuddyAction(type);
    if (res.ok) {
      setBuddy((prev) => (prev ? { ...prev, type } : { type, stage: 1 }));
    }
    setLoading(false);
    setDialogOpen(false);
  };

  const handleWater = () => {
    setWatering(true);
    setTimeout(() => {
      setWatering(false);
      setWaterMsg(true);
      setTimeout(() => setWaterMsg(false), 3000);
    }, 1200);
  };

  // Determine stage based on current streak
  let currentStage = 1;
  let stageName = "Bibit Baru";
  let stageEmoji = "🌱";

  if (streak >= 15) {
    currentStage = 4;
    stageName = "Pohon Abadi";
  } else if (streak >= 7) {
    currentStage = 3;
    stageName = "Tanaman Dewasa";
  } else if (streak >= 3) {
    currentStage = 2;
    stageName = "Kecambah Hijau";
  }

  // Override emoji based on buddy type & stage
  const selectedBuddy = BUDDY_TYPES.find((b) => b.id === (buddy?.type ?? "bunga"));
  if (selectedBuddy) {
    if (currentStage === 1) {
      stageEmoji = "🌱"; // Bibit
    } else if (currentStage === 2) {
      stageEmoji = "🌿"; // Kecambah
    } else {
      stageEmoji = selectedBuddy.emoji; // Dewasa / Pohon
    }
  }

  // Calculate progress to next stage
  let nextStageRequirement = 3;
  let prevStageRequirement = 0;
  if (currentStage === 2) {
    prevStageRequirement = 3;
    nextStageRequirement = 7;
  } else if (currentStage === 3) {
    prevStageRequirement = 7;
    nextStageRequirement = 15;
  }

  const streakForCurrentStage = streak - prevStageRequirement;
  const neededForNextStage = nextStageRequirement - prevStageRequirement;
  const progressPct =
    currentStage === 4
      ? 100
      : Math.min(100, Math.max(0, (streakForCurrentStage / neededForNextStage) * 100));

  if (loading && !buddy) {
    return (
      <div className="flex h-44 items-center justify-center rounded-3xl border border-border/40 bg-card/60 p-5 shadow-md">
        <Loader2 className="animate-spin text-[var(--teal)]" size={20} />
      </div>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-teal-500/5 via-emerald-500/5 to-transparent p-5 shadow-[0_8px_30px_rgba(80,20,50,0.02)] backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-emerald-500/10 blur-2xl"
      />

      <div className="relative flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/50 bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            <Sprout size={9} />
            Virtual Buddy
          </span>
          <h3 className="mt-2 font-heading text-[15px] font-bold text-foreground">
            {selectedBuddy?.name ?? "Teman Belajar"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Stage: <span className="font-semibold text-foreground">{stageName}</span>
          </p>
        </div>

        {/* Big Plant Animation */}
        <div className="relative flex size-16 items-center justify-center text-5xl">
          <motion.div
            animate={{
              y: watering ? [0, -4, 0] : [0, -2, 0],
              scale: watering ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: watering ? 0.6 : 3,
              repeat: watering ? 1 : Infinity,
              ease: "easeInOut",
            }}
          >
            {stageEmoji}
          </motion.div>

          <AnimatePresence>
            {watering && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.5 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute text-teal-400 pointer-events-none"
              >
                💧💧
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {waterMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-6 bg-teal-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm"
              >
                Segar! ✨
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress & Actions */}
      <div className="mt-4 space-y-3 relative z-10">
        {currentStage < 4 ? (
          <div>
            <div className="flex justify-between text-[9px] font-semibold text-muted-foreground mb-1">
              <span>Pertumbuhan Buddy</span>
              <span>
                {streak} / {nextStageRequirement} Hari
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
            <Sparkles size={9} />
            <span>Buddy sudah tumbuh maksimal ke level tertinggi! 🔥</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleWater}
            disabled={watering}
            size="xs"
            variant="outline"
            className="rounded-full text-[10px] py-1 h-7 flex-1 border-teal-200/50 bg-teal-500/5 hover:bg-teal-500/10 hover:text-teal-600"
          >
            <Droplet size={11} className="text-teal-500 mr-1" fill="currentColor" />
            Siram Tanaman
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="xs"
                variant="outline"
                className="rounded-full text-[10px] py-1 h-7 border-border/40"
              >
                <RefreshCw size={11} className="mr-1" />
                Ganti Buddy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl p-5">
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">Pilih Virtual Buddy Kamu</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-3">
                {BUDDY_TYPES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBuddy(b.id)}
                    className={cn(
                      "flex items-center gap-4 text-left p-3 rounded-2xl border transition-all hover:bg-muted/40",
                      buddy?.type === b.id
                        ? "border-teal-500 bg-teal-500/5"
                        : "border-border/40"
                    )}
                  >
                    <span className="text-3xl">{b.emoji}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">{b.name}</p>
                      <p className="text-[10.5px] text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </article>
  );
}
