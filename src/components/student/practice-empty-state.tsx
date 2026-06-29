"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { QuotaExhaustedModal } from "@/components/student/quota-exhausted-modal";
import { generatePracticeQuestionsForSubject } from "@/server/actions/generate-practice-questions";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function PracticeEmptyState({
  error,
  subjects,
  subjectId,
}: {
  error?: string;
  subjects: Subject[];
  subjectId?: string;
}) {
  const router = useRouter();
  const [autoGenerating, setAutoGenerating] = React.useState(false);
  const [autoGenError, setAutoGenError] = React.useState<string | null>(null);
  const [quotaModalOpen, setQuotaModalOpen] = React.useState(false);
  const autoGenTriggered = React.useRef(false);

  // Auto-generate questions when subjectId is available and error indicates no content
  React.useEffect(() => {
    if (!subjectId || autoGenTriggered.current) return;
    if (autoGenerating) return;

    const shouldAutoGenerate =
      error === "Belum ada konsep yang bisa dilatih" ||
      error === "Belum ada soal untuk konsep ini";

    if (shouldAutoGenerate) {
      autoGenTriggered.current = true;
      setAutoGenerating(true);
      generatePracticeQuestionsForSubject({
        subjectId,
        totalCount: 10,
      })
        .then((result) => {
          if (result.ok && result.generated && result.generated > 0) {
            router.refresh();
          } else if (result.ok && result.generated === 0) {
            setQuotaModalOpen(true);
            setAutoGenError("Kuota harian habis. Coba lagi besok.");
          } else {
            setAutoGenError(result.error ?? "Gagal generate soal otomatis");
          }
        })
        .catch(() => {
          setAutoGenError("Gagal generate soal otomatis");
        })
        .finally(() => {
          setAutoGenerating(false);
        });
    }
  }, [subjectId, error, autoGenerating, router]);

  const handleManualGenerate = async () => {
    if (!subjectId) return;
    setAutoGenerating(true);
    setAutoGenError(null);
    try {
      const result = await generatePracticeQuestionsForSubject({
        subjectId,
        totalCount: 10,
      });
      if (result.ok && result.generated && result.generated > 0) {
        router.refresh();
      } else if (result.ok && result.generated === 0) {
        setQuotaModalOpen(true);
        setAutoGenError("Kuota harian habis. Coba lagi besok.");
      } else {
        setAutoGenError(result.error ?? "Gagal generate soal");
      }
    } catch {
      setAutoGenError("Gagal generate soal");
    } finally {
      setAutoGenerating(false);
    }
  };

  return (
    <>
      <QuotaExhaustedModal
        open={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        quotaType="Generate Soal"
      />
      <div className="rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl">
        {autoGenerating ? (
          <>
            <Loader2
              size={28}
              className="mx-auto animate-spin text-[var(--coral)]"
            />
            <p className="mt-3 font-heading text-[16px] font-bold">
              Sedang menyiapkan soal...
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              AI sedang membuat soal latihan untuk mapel ini. Tunggu sebentar ya.
            </p>
          </>
        ) : (
          <>
            <Sparkles size={28} className="mx-auto text-[var(--coral)]" />
            <p className="mt-3 font-heading text-[16px] font-bold">
              Belum ada soal latihan
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {autoGenError || error || "Generate soal untuk mapel yang kamu inginkan."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {subjectId && (
                <Button
                  size="sm"
                  className="rounded-full bg-[var(--coral)] text-white"
                  onClick={handleManualGenerate}
                >
                  <Sparkles size={13} />
                  Generate Soal Sekarang
                </Button>
              )}
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[var(--purple)] text-white"
              >
                <Link href="/practice/generate">
                  <Sparkles size={13} />
                  Generate Soal Custom
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/practice">Pilih Mode Latihan</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
