import { GraduationCap, Heart } from "lucide-react";
import Link from "next/link";

const links = {
  produk: [
    { label: "Fitur", href: "#fitur" },
    { label: "Kursus", href: "#katalog" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Progress", href: "#progress" },
  ],
};

export function Footer() {
  return (
    <footer className="container-px mt-12 pb-10">
      <div className="clay p-8 md:p-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)]">
                <GraduationCap size={18} strokeWidth={2.5} />
              </span>
              <span className="font-heading text-[17px] font-semibold text-gradient">
                Spark Ai
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Tutor AI adaptif buat siswa SMA & SMK Indonesia. Belajar makin
              paham, makin seru, dan gak ngebosenin.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                <GraduationCap size={13} />
                spark-ai.vercel.app
              </span>
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="mb-4 font-heading text-[12px] font-bold uppercase tracking-wider text-foreground">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-dashed border-border/60 pt-6 text-[12px] text-muted-foreground sm:flex-row">
          <p className="flex items-center gap-1.5">
            © 2026 Spark Ai. Dibuat dengan{" "}
            <Heart size={12} className="text-[var(--coral)]" /> buat pendidikan
            Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
