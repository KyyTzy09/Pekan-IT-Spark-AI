import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ParentLinkForm } from "@/components/parent/link-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Hubungkan ke Anak — Spark Ai",
  description: "Masukkan kode undangan dari anak kamu untuk mulai memantau.",
};

export default async function ParentLinkPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "PARENT") {
    redirect("/");
  }

  const linked = await prisma.parentStudentLink.findMany({
    where: {
      parentId: session.user.id,
      status: "ACCEPTED",
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="relative min-h-svh w-full">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      />
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-center gap-2">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl"
          >
            <Link href="/parent">
              <ArrowLeft size={14} />
              Kembali
            </Link>
          </Button>
        </div>

        <header className="mt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--blue)_22%,transparent)] bg-[color-mix(in_oklch,var(--blue)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--blue)]">
            <Heart size={10} strokeWidth={2.5} />
            Hubungkan
          </span>
          <h1 className="mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
            Hubungkan ke anak kamu
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Minta kode undangan ke anak kamu, lalu masukin di sini. Setiap kode
            cuma bisa dipakai 1x dan berlaku 7 hari.
          </p>
        </header>

        <div className="mt-7">
          <ParentLinkForm />
        </div>

        {linked.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-[14px] font-bold text-foreground">
              Anak yang sudah terhubung
            </h2>
            <ul className="mt-3 space-y-2">
              {linked.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3.5"
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
                    <p className="font-heading text-[13.5px] font-bold text-foreground">
                      {l.student.name ?? "Tanpa nama"}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {l.student.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
