import Link from "next/link";
import { ArrowRight, Check, Heart, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const benefits = [
  "Gratis selamanya untuk siswa",
  "Gak perlu kartu kredit",
  "Langsung pakai, gak ada install",
  "Aman & privat, sesuai UU PDP",
];

export function CTASection() {
  return (
    <section className="container-px py-16 md:py-24">
      <Reveal>
        <div className="clay relative overflow-hidden p-8 md:p-12 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.97 0.05 25 / 0.5), oklch(0.96 0.04 70 / 0.3) 50%, oklch(0.96 0.05 200 / 0.4))",
            }}
          />
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_10%,transparent)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--coral)]">
                <Heart size={13} /> Gratis, tanpa syarat
              </div>
              <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight md:text-[44px]">
                Siap belajar dengan cara yang{" "}
                <span className="text-gradient-warm">bener-bener ngertiin</span>{" "}
                kamu?
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Daftar sekarang, pilih mata pelajaran fokus kamu, dan mulai
                ngobrol sama Spark. Cuma butuh email — gak ada biaya, gak ada
                iklan, gak ada jebakan.
              </p>

              <ul className="grid gap-2.5 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-2.5 text-[13.5px] font-semibold text-foreground"
                  >
                    <span className="grid size-5 place-items-center rounded-full bg-[var(--teal)] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="xl"
                  className="shadow-[0_6px_20px_rgba(255,107,107,0.4)] hover:shadow-[0_8px_24px_rgba(255,107,107,0.5)]"
                >
                  <Link href="/auth/register">
                    <Rocket size={18} /> Daftar Gratis Sekarang
                  </Link>
                </Button>
                <Button asChild size="xl" variant="secondary">
                  <Link href="/auth/login">
                    Aku udah punya akun
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>

              <p className="text-[12px] font-semibold text-muted-foreground">
                Punya pertanyaan?{" "}
                <Link
                  href="/contact"
                  className="text-[var(--coral)] underline-offset-4 hover:underline"
                >
                  Ngobrol sama tim kami
                </Link>
                .
              </p>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[320px]">
              <div
                className="absolute inset-0 rounded-full opacity-30 blur-2xl"
                style={{ background: "var(--hero-bg)" }}
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[color-mix(in_oklch,var(--teal)_30%,transparent)]"
                style={{ animation: "spin 24s linear infinite" }}
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dotted border-[color-mix(in_oklch,var(--purple)_25%,transparent)]"
                style={{ animation: "spin 36s linear infinite reverse" }}
                aria-hidden
              />
              <div className="absolute left-1/2 top-1/2 flex h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--purple)] via-[var(--pink)] to-[var(--coral)] text-white shadow-[0_20px_60px_rgba(168,85,247,0.4),inset_0_-10px_30px_rgba(0,0,0,0.15)] anim-float">
                <div
                  aria-hidden
                  className="absolute inset-3 rounded-full bg-gradient-to-br from-white/30 to-transparent"
                />
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <span className="font-heading text-[44px] font-bold leading-none">A+</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                    Mulai sekarang
                  </span>
                </div>
              </div>

              <div className="absolute -right-2 top-[18%] flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2.5 shadow-[0_10px_24px_rgba(45,27,105,0.12)] backdrop-blur-md anim-float">
                <Sparkles size={16} className="text-[var(--coral)]" />
                <span className="text-[12px] font-bold text-foreground">+150 XP</span>
              </div>
              <div
                className="absolute -left-2 bottom-[18%] flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2.5 shadow-[0_10px_24px_rgba(45,27,105,0.12)] backdrop-blur-md anim-float"
                style={{ animationDelay: "1.4s" }}
              >
                <Heart size={16} className="text-[var(--coral)]" />
                <span className="text-[12px] font-bold text-foreground">Streak 7 hari</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
