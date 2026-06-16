import { ArrowLeft, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { UploadView } from "@/components/student/upload-view";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listDocuments } from "@/server/actions/documents";

export const metadata: Metadata = {
  title: "Upload materi — Spark Ai",
  description: "Upload PDF atau DOCX dari guru.",
};

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return (
      <div className="space-y-5 sm:space-y-7">
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.15 175 / 0.5), transparent 70%)",
              }}
            />
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
              <BookOpen size={10} strokeWidth={2.5} />
              Upload materi
            </span>
            <h1 className="relative mt-2 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
              Login dulu yuk
            </h1>
            <p className="relative mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
              Asistensi materi khusus buat siswa Spark. Masuk dulu biar bisa
              upload PDF/DOCX dari guru kamu.
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/auth/login">
                  <ArrowLeft size={13} />
                  Masuk
                </Link>
              </Button>
            </div>
          </header>
        </Reveal>
      </div>
    );
  }

  const result = await listDocuments();
  const initial = result.ok ? result.documents : [];

  return <UploadView initialDocuments={initial} />;
}
