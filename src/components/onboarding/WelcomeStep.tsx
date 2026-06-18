import { BookOpen, Heart, Sparkles, Wand2 } from "lucide-react";
import { SparkCharacter } from "@/components/student/spark-character";

export function WelcomeStep({
  userName,
  onChooseNational,
  onChooseCustom,
}: {
  userName: string;
  onChooseNational: () => void;
  onChooseCustom: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center pt-2">
        <SparkCharacter
          size="lg"
          color="default"
          accessory="none"
          background="default"
        />
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
            <Heart size={14} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[13px] font-bold text-foreground">
              Hai, {userName}! Aku Spark ✨
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              Temen belajar AI kamu. Isi beberapa hal dulu biar aku bisa nemenin
              kamu dengan pas.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[12px] font-bold text-foreground/80">
        Mau mulai dari mana?
      </p>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={onChooseNational}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:border-[var(--teal)]/40 hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)] active:scale-[0.98] active:border-[var(--teal)]/60"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.14 175 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] transition-transform group-hover:-translate-y-0.5 group-active:scale-95">
              <BookOpen size={20} strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-[15px] font-bold text-foreground">
                  Mulai dari mapel nasional
                </p>
                <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--teal)] ring-1 ring-[var(--teal)]/20">
                  Populer
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Pilih dari mapel Kurikulum Merdeka yang tersedia. Cocok buat
                kamu yang mau belajar sesuai kurikulum sekolah.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["Profil", "Pilih Mapel", "Gaya Belajar", "Pretest"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--teal)]/10 px-2 py-0.5 text-[9.5px] font-bold text-[var(--teal)]"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onChooseCustom}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 text-left backdrop-blur-sm transition-all hover:border-[var(--coral)]/40 hover:shadow-[0_8px_24px_rgba(225,29,72,0.12)] active:scale-[0.98] active:border-[var(--coral)]/60"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-8 -top-8 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
            style={{
              background:
                "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)] transition-transform group-hover:-translate-y-0.5 group-active:scale-95">
              <Wand2 size={20} strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-[15px] font-bold text-foreground">
                  Bikin mapel kustom
                </p>
                <span className="rounded-full bg-[var(--coral)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--coral)] ring-1 ring-[var(--coral)]/20">
                  AI
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Mapel yang kamu mau belum ada? Tulis aja, Spark AI bakal
                langsung bikin outline + pretest buat kamu.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["Input Nama Mapel", "AI Generate", "Pretest"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--coral)]/10 px-2 py-0.5 text-[9.5px] font-bold text-[var(--coral)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 p-3.5 backdrop-blur-sm">
        <div className="flex items-start gap-2.5">
          <Sparkles
            size={14}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-[var(--purple)]"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Tips:</span> Pilih kalo
            kamu mau mapel yang biasanya dipelajari di sekolah (Matematika,
            Fisika, dll). Pilih{" "}
            <span className="font-bold">Bikin mapel kustom</span> kalau mapel
            kamu unik atau ga ada di kurikulum nasional.
          </p>
        </div>
      </div>
    </div>
  );
}
