"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getParentAiRecommendation } from "@/server/actions/parent";

type Props = {
  studentId: string;
  studentName: string;
};

export function ParentAiRecommendation({ studentId, studentName }: Props) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getParentAiRecommendation(studentId, studentName)
      .then((res) => {
        if (!active) return;
        if (res.ok && res.recommendation) {
          setRecommendation(res.recommendation);
        } else {
          // Fallback if error
          setRecommendation(
            `
• **Ajak Ngobrol Santai**: Tanyakan kepada ${studentName} pelajaran apa yang paling menarik hari ini tanpa memberi tekanan ujian.
• **Fokus pada Usaha, Bukan Hasil**: Berikan apresiasi pada konsistensi belajar harian ${studentName} dan bantu dia merasa nyaman jika menemui soal yang sulit.
• **Ciptakan Ruang Kondusif**: Sediakan tempat belajar yang tenang dan bebas gangguan agar ${studentName} bisa lebih fokus menyelesaikan misi belajarnya.
          `.trim(),
          );
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId, studentName]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--blue)]/20 bg-gradient-to-br from-[var(--blue)]/5 via-transparent to-[var(--teal)]/5 p-6 shadow-md backdrop-blur-xl sm:p-8">
      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
        <Sparkles size={260} className="text-[var(--blue)] animate-pulse" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start relative">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_6px_20px_rgba(20,184,166,0.18)]">
          <Lightbulb
            size={22}
            className={isLoading ? "animate-pulse" : "animate-bounce"}
          />
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[var(--blue)] flex items-center gap-1">
              Rekomendasi AI Spark
              {isLoading && (
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                  Berpikir...
                </span>
              )}
            </span>
            <h2 className="font-heading text-[18px] font-extrabold leading-tight text-foreground sm:text-[20px] mt-0.5">
              Tips Dukungan Orang Tua
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3.5 pt-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-11/12" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-9/12" />
            </div>
          ) : (
            recommendation && (
              <div
                className="text-[13.5px] leading-relaxed text-muted-foreground space-y-3.5 pt-1 transition-opacity duration-500 ease-in-out
                  [&>p]:leading-relaxed [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc
                  [&_strong]:text-foreground [&_strong]:font-bold"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: AI recommendation text contains safe formatted HTML
                dangerouslySetInnerHTML={{
                  __html: recommendation
                    .replace(/\n\n/g, "<br/><br/>")
                    .replace(/\n/g, "<br/>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/•\s*(.*?)(<br\/>|$)/g, "<li>$1</li>")
                    .replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>")
                    .replace(/<\/ul>\s*<ul>/g, ""),
                }}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}
