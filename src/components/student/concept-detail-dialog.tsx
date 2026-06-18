"use client";

import {
  BookOpen,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Play,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { startNewChat } from "@/server/actions/chat";
import { getConceptDetail, markConceptAsRead } from "@/server/actions/subjects";
import { gooeyToast } from "goey-toast";

interface ConceptDetailDialogProps {
  conceptId: string | null;
  open: boolean;
  onClose: () => void;
}

type ConceptData = {
  id: string;
  name: string;
  description: string | null;
  contentMd: string | null;
  masteryScore: number;
  status: string;
  topic: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    };
  };
};

export function ConceptDetailDialog({
  conceptId,
  open,
  onClose,
}: ConceptDetailDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<ConceptData | null>(null);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [readLoading, setReadLoading] = React.useState(false);

  React.useEffect(() => {
    const id = conceptId;
    if (!open || !id) {
      setData(null);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await getConceptDetail(id as string);
        if (res) {
          setData(res as ConceptData);
        }
      } catch (err) {
        console.error("Gagal memuat detail konsep:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [conceptId, open]);

  const handleStartPractice = () => {
    if (!conceptId) return;
    onClose();
    router.push(`/practice?concept=${conceptId}`);
  };

  const handleAskTutor = async () => {
    if (!data || chatLoading) return;
    setChatLoading(true);
    try {
      const firstMessage = `Halo Spark! Boleh tolong jelaskan lebih dalam tentang konsep "${data.name}" di mata pelajaran "${data.topic.subject.name}"? Aku ingin mempelajari dan berdiskusi tentang materi ini.`;
      const res = await startNewChat({ firstMessage });
      onClose();
      router.push(`/chat/${res.sessionId}`);
    } catch (err) {
      console.error("Gagal memulai sesi chat tutor:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!conceptId || readLoading || !data) return;
    setReadLoading(true);
    try {
      const res = await markConceptAsRead(conceptId);
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                status: res.newStatus,
                masteryScore:
                  prev.status === "NOT_STARTED" ? 0.1 : prev.masteryScore,
              }
            : null,
        );
        if (res.earnedXp > 0) {
          gooeyToast.success("Materi Selesai Dibaca!", {
            description: `Kamu mendapatkan +${res.earnedXp} XP!`,
          });
        }
      }
    } catch (err) {
      console.error("Gagal menandai materi selesai dibaca:", err);
      gooeyToast.error("Gagal memperbarui status membaca");
    } finally {
      setReadLoading(false);
    }
  };

  const masteryPct = Math.round((data?.masteryScore ?? 0) * 100);
  const isMastered = data?.status === "MASTERED";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0 bg-card border-l border-border/40 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[var(--coral)]" size={32} />
            <p className="text-sm text-muted-foreground font-medium">
              Memuat materi belajar...
            </p>
          </div>
        ) : data ? (
          <>
            {/* Header Area */}
            <div className="relative border-b border-border/40 p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-25 blur-3xl"
                style={{
                  background: data.topic.subject.color
                    ? `radial-gradient(circle, ${data.topic.subject.color}55, transparent 70%)`
                    : "radial-gradient(circle, var(--coral)55, transparent 70%)",
                }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5"
                    style={{
                      color: data.topic.subject.color ?? "var(--coral)",
                    }}
                  >
                    <span>{data.topic.subject.icon ?? "📚"}</span>
                    {data.topic.subject.name}
                  </span>
                  <span>•</span>
                  <span>{data.topic.name}</span>
                </div>
                <SheetTitle className="mt-2 font-heading text-[22px] font-bold leading-tight text-foreground">
                  {data.name}
                </SheetTitle>
                <SheetDescription className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {data.description ||
                    "Mari pelajari konsep ini bersama Spark AI."}
                </SheetDescription>

                {/* Progress Indicators */}
                <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border/40 bg-background/40 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star
                        size={11}
                        className="text-[var(--yellow)]"
                        fill={isMastered ? "currentColor" : "none"}
                      />
                      Tingkat Penguasaan
                    </span>
                    <span className="text-foreground">{masteryPct}%</span>
                  </div>
                  <Progress value={masteryPct} className="h-2 bg-muted/80" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>
                      Status:{" "}
                      {data.status === "NOT_STARTED"
                        ? "Belum mulai"
                        : data.status === "LEARNING"
                          ? "Sedang dipelajari"
                          : data.status === "STRUGGLING"
                            ? "Butuh bantuan"
                            : "Selesai Dikuasai ✨"}
                    </span>
                    {isMastered && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 size={10} /> Dikuasai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Material Area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid size-8 place-items-center rounded-xl bg-[var(--coral)]/10 text-[var(--coral)] text-[14px]">
                    <BookOpen size={16} />
                  </div>
                  <h3 className="font-heading text-[15px] font-bold text-foreground">
                    Materi Penjelasan
                  </h3>
                </div>

                <div className="border border-border/40 rounded-2xl bg-background/30 p-4 sm:p-5">
                  {data.contentMd ? (
                    <DocumentMarkdownText text={data.contentMd} />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Materi belajar sedang disiapkan.
                    </p>
                  )}
                </div>
              </article>
            </div>

            {/* Sticky Action Footer */}
            <div className="border-t border-border/40 bg-background/60 p-5 flex flex-wrap gap-2.5 items-center justify-end backdrop-blur-md">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAskTutor}
                disabled={chatLoading}
                className="rounded-full font-semibold border-border/40 hover:bg-background/80"
              >
                {chatLoading ? (
                  <>
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <MessageCircle size={13} className="mr-1.5" />
                    Tanya Spark AI
                  </>
                )}
              </Button>

              {data.status === "NOT_STARTED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={readLoading}
                  className="rounded-full font-semibold border-border/40 hover:bg-background/80"
                >
                  {readLoading ? (
                    <>
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={13}
                        className="mr-1.5 text-emerald-600"
                      />
                      Selesai Membaca (+5 XP)
                    </>
                  )}
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleStartPractice}
                className="rounded-full bg-[var(--coral)] font-bold text-white hover:bg-[var(--coral)]/90 shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
              >
                <Play size={13} className="mr-1.5 fill-current" />
                Mulai Latihan
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="font-heading text-base font-bold text-foreground">
              Gagal memuat data
            </p>
            <p className="text-sm text-muted-foreground">
              Materi tidak dapat ditemukan. Coba lagi nanti.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
