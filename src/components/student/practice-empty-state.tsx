"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { GeneratePracticeDialog } from "@/components/student/generate-practice-dialog";
import { Button } from "@/components/ui/button";
import { generatePracticeQuestionsForSubject } from "@/server/actions/generate-practice-questions";

type Subject = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export function PracticeEmptyState({
  error,
  subjects,
}: {
  error?: string;
  subjects: Subject[];
}) {
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);

  const handleGenerate = async (subjectId: string, count: number) => {
    const result = await generatePracticeQuestionsForSubject({
      subjectId,
      totalCount: count,
    });
    if (result.ok) {
      window.location.reload();
    } else {
      alert(result.error || "Gagal generate soal");
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-border/40 bg-card/80 p-6 text-center shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl">
        <Sparkles size={28} className="mx-auto text-[var(--coral)]" />
        <p className="mt-3 font-heading text-[16px] font-bold">
          Belum ada soal latihan
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {error || "Generate soal untuk mapel yang kamu inginkan."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            className="rounded-full bg-[var(--purple)] text-white"
            onClick={() => setGenerateDialogOpen(true)}
          >
            <Sparkles size={13} />
            Generate Latihan Soal
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/subjects">Jelajahi mapel</Link>
          </Button>
        </div>
      </div>
      <GeneratePracticeDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        subjects={subjects}
        onGenerate={handleGenerate}
      />
    </>
  );
}
