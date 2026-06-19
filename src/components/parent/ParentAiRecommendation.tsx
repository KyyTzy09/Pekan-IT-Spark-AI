import { Lightbulb, Sparkles } from "lucide-react";

type Props = {
  recommendation: string | null;
  studentName: string;
};

const FALLBACK = (name: string) =>
  `
• **Ajak Ngobrol Santai**: Tanyakan kepada ${name} pelajaran apa yang paling menarik hari ini tanpa memberi tekanan ujian.
• **Fokus pada Usaha, Bukan Hasil**: Berikan apresiasi pada konsistensi belajar harian ${name} dan bantu dia merasa nyaman jika menemui soal yang sulit.
• **Ciptakan Ruang Kondusif**: Sediakan tempat belajar yang tenang dan bebas gangguan agar ${name} bisa lebih fokus menyelesaikan misi belajarnya.
`.trim();

function formatRecommendation(text: string): string {
  return text
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/•\s*(.*?)(<br\/>|$)/g, "<li>$1</li>")
    .replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/g, "");
}

export function ParentAiRecommendation({ recommendation, studentName }: Props) {
  const content = recommendation || FALLBACK(studentName);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--blue)]/20 bg-gradient-to-br from-[var(--blue)]/5 via-transparent to-[var(--teal)]/5 p-6 shadow-md backdrop-blur-xl sm:p-8">
      <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
        <Sparkles size={260} className="text-[var(--blue)]" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start relative">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white shadow-[0_6px_20px_rgba(20,184,166,0.18)]">
          <Lightbulb size={22} />
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[var(--blue)] flex items-center gap-1">
              Rekomendasi AI Spark
            </span>
            <h2 className="font-heading text-[18px] font-extrabold leading-tight text-foreground sm:text-[20px] mt-0.5">
              Tips Dukungan Orang Tua
            </h2>
          </div>

          <div
            className="text-[13.5px] leading-relaxed text-muted-foreground space-y-3.5 pt-1
              [&>p]:leading-relaxed [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc
              [&_strong]:text-foreground [&_strong]:font-bold"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: AI recommendation text contains safe formatted HTML
            dangerouslySetInnerHTML={{
              __html: formatRecommendation(content),
            }}
          />
        </div>
      </div>
    </section>
  );
}
