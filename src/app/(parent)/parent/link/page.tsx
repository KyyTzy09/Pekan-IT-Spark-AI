import { Heart, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { ParentLinkForm } from "@/components/parent/link-form";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Hubungkan Anak — Spark Ai",
  description: "Hubungkan akun orang tua dengan kode unik dari anak.",
};

export default async function ParentLinkPage() {
  const session = await getSession();
  if (!session?.id) return null;

  const linked = await prisma.parentStudentLink.findMany({
    where: {
      parentId: session.id,
      status: "ACCEPTED",
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--blue)_22%,transparent)] bg-[color-mix(in_oklch,var(--blue)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">
          <Heart size={10} strokeWidth={2.5} />
          Hubungkan
        </span>
        <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
          Hubungkan ke anak kamu
        </h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Minta kode undangan dari anak kamu di halaman{" "}
          <span className="font-semibold text-foreground/80">
            Pengaturan &gt; Undang Orang Tua
          </span>{" "}
          pada akun siswanya, lalu masukkan di bawah ini.
        </p>
      </header>

      <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:p-7">
        <ParentLinkForm />
      </div>

      {linked.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-[14px] font-bold text-foreground uppercase tracking-wider">
            Anak yang sudah terhubung
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {linked.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 p-4 transition-all hover:bg-card/75"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--teal), var(--blue))",
                  }}
                >
                  <Sparkles size={14} strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[13.5px] font-bold text-foreground leading-snug">
                    {l.student.name ?? "Tanpa nama"}
                  </p>
                  <p className="truncate text-[11.5px] text-muted-foreground mt-0.5">
                    {l.student.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
