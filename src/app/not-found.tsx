import { Home, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--coral)]/20 bg-card/80 p-6 text-center shadow-lg backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-[var(--coral)]/15 opacity-50 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-lg">
            <Search size={20} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              404 — Tidak Ditemukan
            </p>
            <h1 className="mt-1 font-heading text-[20px] font-bold leading-tight text-foreground">
              Halaman Tidak Ditemukan
            </h1>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Maaf, halaman yang kamu cari tidak dapat ditemukan atau telah
              dipindahkan.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              asChild
              className="rounded-full bg-[var(--coral)] text-white shadow-lg hover:bg-[var(--coral)]/90"
            >
              <Link href="/">
                <Home size={13} className="mr-1" /> Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
