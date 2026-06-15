import { ArrowLeft, Compass, Home } from "lucide-react";
import Link from "next/link";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";

export default function StudentNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-4">
          <SparkCharacter size="md" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              Belum sampai situ
            </p>
            <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight text-foreground">
              Halaman ini belum ada
            </h1>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Kemungkinan lagi dalam tahap pembangunan, atau alamatnya keliru.
              Balik ke beranda dulu yuk.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
            >
              <Link href="/dashboard">
                <Home size={13} strokeWidth={2.5} />
                Beranda
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/subjects">
                <Compass size={13} />
                Jelajahi mapel
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/dashboard">
                <ArrowLeft size={13} />
                Kembali
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
