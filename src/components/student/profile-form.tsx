"use client";

import { gooeyToast } from "goey-toast";
import { Loader2, Save } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/server/actions/profile";

type ProfileFormProps = {
  initialName: string;
  initialSchool: string;
  initialGrade: number;
  initialLearningStyle: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC";
};

export function ProfileForm({
  initialName,
  initialSchool,
  initialGrade,
  initialLearningStyle,
}: ProfileFormProps) {
  const [name, setName] = React.useState(initialName);
  const [school, setSchool] = React.useState(initialSchool);
  const [grade, setGrade] = React.useState(initialGrade);
  const [learningStyle, setLearningStyle] =
    React.useState(initialLearningStyle);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await updateProfileAction({
      name,
      school,
      grade: Number(grade),
      learningStyle,
    });

    setSaving(false);
    if (!res.ok) {
      const errMsg = res.error || "Gagal menyimpan profil.";
      setError(errMsg);
      gooeyToast.error(errMsg);
    } else {
      setSuccess(true);
      gooeyToast.success("Profil berhasil diperbarui!");
      timerRef.current = setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-500/35 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 font-semibold">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald-500/35 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold">
          Profil berhasil diperbarui!
        </p>
      )}

      <div>
        <label
          htmlFor="name-input"
          className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          Nama Lengkap
        </label>
        <Input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-2xl border-border/40 bg-background/50 h-10 px-3.5 text-[13px] backdrop-blur-sm focus:border-[var(--coral)] focus:ring-[var(--coral)]/25"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="school-input"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Sekolah
          </label>
          <Input
            id="school-input"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
            className="rounded-2xl border-border/40 bg-background/50 h-10 px-3.5 text-[13px] backdrop-blur-sm focus:border-[var(--coral)] focus:ring-[var(--coral)]/25"
          />
        </div>
        <div>
          <label
            htmlFor="grade-select"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Kelas
          </label>
          <select
            id="grade-select"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="flex w-full rounded-2xl border border-border/40 bg-background/50 h-10 px-3 text-[13px] outline-none backdrop-blur-sm focus:border-[var(--coral)] focus:ring-[var(--coral)]/25"
          >
            <option value={10}>Kelas 10</option>
            <option value={11}>Kelas 11</option>
            <option value={12}>Kelas 12</option>
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Gaya Belajar Spark AI
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                id: "VISUAL",
                name: "Visual (Gambar)",
                desc: "Materi disertai bagan/grafik",
              },
              {
                id: "TEXTUAL",
                name: "Tekstual",
                desc: "Penjelasan tertulis mendalam",
              },
              {
                id: "EXAMPLE_HEAVY",
                name: "Banyak Contoh",
                desc: "Belajar via kasus nyata",
              },
              {
                id: "SOCRATIC",
                name: "Sokratik (Tanya)",
                desc: "AI membimbing lewat tanya jawab",
              },
            ] as const
          ).map((style) => {
            const active = learningStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setLearningStyle(style.id)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? "border-[var(--coral)]/40 bg-[var(--coral)]/8"
                    : "border-border/40 bg-background/30 hover:border-border"
                }`}
              >
                <p
                  className={`text-[12.5px] font-bold ${active ? "text-[var(--coral)]" : "text-foreground"}`}
                >
                  {style.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  {style.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-[var(--coral)] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.25)] hover:bg-[var(--coral)]/90 h-11"
      >
        {saving ? (
          <>
            <Loader2 className="animate-spin mr-1.5" size={14} />
            Menyimpan Perubahan...
          </>
        ) : (
          <>
            <Save size={14} className="mr-1.5" />
            Simpan Perubahan
          </>
        )}
      </Button>
    </form>
  );
}
