import {
  BookOpen,
  Brain,
  Heart,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panduan Orang Tua — Spark Ai",
  description: "Tips dan panduan untuk mendampingi anak dalam belajar.",
};

const TIPS = [
  {
    icon: Heart,
    title: "Apresiasi Usaha, Bukan Hanya Hasil",
    description:
      "Berikan pujian atas konsistensi dan usaha belajar anak, bukan hanya nilai yang didapat. Ini membangun motivasi intrinsik dan rasa percaya diri.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageCircle,
    title: "Ngobrol Santai Tentang Belajar",
    description:
      "Tanyakan apa yang dipelajari hari ini dengan nada santai, bukan interogasi. Ini membuat anak merasa didukung, bukan diawasi.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Bantu Saat Stuck, Bukan Kasih Jawaban",
    description:
      "Saat anak kesulitan, ajak mereka berpikir dengan pertanyaan pemantik: 'Coba baca lagi pelan-pelan, apa yang kamu pahami dari soal ini?'",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Lightbulb,
    title: "Hubungkan Materi dengan Dunia Nyata",
    description:
      "Bantu anak melihat relevansi materi dengan kehidupan sehari-hari. Contoh: hitung diskon saat belanja untuk belajar persen.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BookOpen,
    title: "Sediakan Ruang Belajar Kondusif",
    description:
      "Pastikan anak punya tempat belajar yang tenang, cukup cahaya, dan minim gangguan. Ini membantu fokus dan retensi materi.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "Rayakan Kemajuan Kecil",
    description:
      "Setiap konsep yang dikuasai layak dirayakan! Bisa dengan stiker, waktu bermain tambahan, atau sekadar high-five. Ini memperkuat kebiasaan positif.",
    color: "from-yellow-500 to-orange-500",
  },
];

const COMMON_MISTAKES = [
  {
    mistake: "Membandingkan dengan teman/saudara",
    correction:
      "Fokus pada progres individu anak, bukan kompetisi dengan orang lain.",
  },
  {
    mistake: "Memaksa belajar berjam-jam tanpa jeda",
    correction:
      "Gunakan teknik Pomodoro: 25 menit belajar, 5 menit istirahat. Otak butuh jeda untuk konsolidasi.",
  },
  {
    mistake: "Langsung kasih jawaban saat anak bingung",
    correction:
      "Bimbing dengan pertanyaan: 'Coba baca lagi, apa yang sudah kamu pahami?' Biarkan mereka menemukan sendiri.",
  },
  {
    mistake: "Menghukum saat nilai jelek",
    correction:
      "Jadikan kesalahan sebagai bahan belajar. Tanya: 'Apa yang bikin kamu kesulitan? Yuk cari tahu bareng.'",
  },
  {
    mistake: "Memaksa anak belajar sesuai jadwal orang tua",
    correction:
      "Libatkan anak dalam menyusun jadwal belajar. Rasa ownership meningkatkan komitmen.",
  },
];

export default function ParentGuidePage() {
  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-2 border-b border-border/20 pb-5">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-md">
            <Sparkles size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-heading text-[24px] font-extrabold tracking-tight text-foreground sm:text-[28px]">
              Panduan Orang Tua
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Tips praktis untuk mendampingi anak belajar dengan efektif dan
              menyenangkan.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="size-5 text-rose-500" fill="currentColor" />
          <h2 className="font-heading text-[18px] font-bold text-foreground">
            6 Tips Suportif untuk Orang Tua
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.title}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-xl transition-all hover:bg-card/80 hover:border-border/60 hover:shadow-lg"
              >
                <div
                  className={`mb-3 grid size-11 place-items-center rounded-xl bg-gradient-to-br ${tip.color} text-white shadow-md`}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="font-heading text-[14px] font-bold text-foreground mb-2">
                  {tip.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="size-5 text-purple-500" />
          <h2 className="font-heading text-[18px] font-bold text-foreground">
            Kesalahan Umum yang Harus Dihindari
          </h2>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-xl space-y-4">
          {COMMON_MISTAKES.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-border/30 bg-background/40 p-4 transition-all hover:bg-background/60"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500 font-bold text-[12px]">
                  ✗
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">
                      {item.mistake}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 pl-3 border-l-2 border-emerald-500/30">
                    <div className="grid size-6 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-500 font-bold text-[11px]">
                      ✓
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground pt-0.5">
                      {item.correction}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--blue)]/20 bg-gradient-to-br from-[var(--blue)]/5 via-transparent to-[var(--teal)]/5 p-6 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-md">
            <Lightbulb size={22} />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-[16px] font-bold text-foreground">
              Ingat, Setiap Anak Unik
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Tidak ada cara yang "benar" untuk mendampingi anak belajar. Yang
              terpenting adalah kehadiran Anda, dukungan emosional, dan
              kesediaan untuk belajar bersama. Rayakan setiap kemajuan kecil,
              dan jadikan kesalahan sebagai kesempatan untuk tumbuh.
            </p>
            <p className="text-[12px] text-muted-foreground italic mt-3">
              — Tim Spark Ai
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
