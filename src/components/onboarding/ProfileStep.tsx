import { BookOpen, GraduationCap, School } from "lucide-react";
import { cn } from "@/lib/utils";

export type EducationLevel = "SMA" | "SMK";

export function ProfileStep({
  educationLevel,
  setEducationLevel,
  grade,
  setGrade,
  school,
  setSchool,
}: {
  educationLevel: EducationLevel;
  setEducationLevel: (v: EducationLevel) => void;
  grade: number;
  setGrade: (v: number) => void;
  school: string;
  setSchool: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Education level */}
      <section>
        <label className="mb-3 block text-[13px] font-bold text-foreground">
          Jenjang pendidikan
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "SMA" as const,
              icon: GraduationCap,
              label: "SMA",
              desc: "Kurikulum umum",
            },
            {
              value: "SMK" as const,
              icon: BookOpen,
              label: "SMK",
              desc: "Kurikulum kejuruan",
            },
          ].map((opt) => {
            const active = educationLevel === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  console.log("[ONBOARDING_CLIENT] educationLevelSelected", {
                    level: opt.value,
                    wasLevel: educationLevel,
                  });
                  setEducationLevel(opt.value);
                }}
                className={cn(
                  "relative rounded-xl border-2 p-5 text-left transition-all duration-200 active:scale-[0.97]",
                  active
                    ? "border-[var(--coral)] bg-[var(--coral)]/5 shadow-[0_8px_24px_rgba(225,29,72,0.12)] ring-4 ring-[var(--coral)]/10"
                    : "border-border/60 bg-card/80 hover:border-border hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "mb-3 grid size-11 place-items-center rounded-lg text-white shadow transition-all",
                    active
                      ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </span>
                <p
                  className={cn(
                    "font-heading text-[16px] font-bold transition-colors",
                    active ? "text-[var(--coral)]" : "text-foreground",
                  )}
                >
                  {opt.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px] transition-colors",
                    active ? "text-[var(--coral)]/70" : "text-muted-foreground",
                  )}
                >
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Grade */}
      <section>
        <label className="mb-3 block text-[13px] font-bold text-foreground">
          Kelas
        </label>
        <div className="flex gap-3">
          {([10, 11, 12] as const).map((g) => {
            const active = grade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  console.log("[ONBOARDING_CLIENT] gradeSelected", {
                    grade: g,
                    wasGrade: grade,
                  });
                  setGrade(g);
                }}
                className={cn(
                  "flex-1 rounded-xl border-2 py-4 text-center transition-all duration-200 active:scale-95",
                  active
                    ? "border-[var(--coral)] bg-[var(--coral)]/5 shadow-[0_8px_24px_rgba(225,29,72,0.12)] ring-4 ring-[var(--coral)]/10"
                    : "border-border/60 bg-card/80 hover:border-border",
                )}
              >
                <p
                  className={cn(
                    "font-heading text-[20px] font-bold transition-colors",
                    active ? "text-[var(--coral)]" : "text-foreground/70",
                  )}
                >
                  {g}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* School input */}
      <section>
        <label
          htmlFor="school"
          className="mb-2 block text-[13px] font-bold text-foreground"
        >
          Nama sekolah
        </label>
        <div
          className={cn(
            "relative flex items-center rounded-xl border-2 bg-card/80 px-1 transition-all duration-200",
            school
              ? "border-[var(--coral)]/50 ring-4 ring-[var(--coral)]/5"
              : "border-border/60 focus-within:border-[var(--coral)] focus-within:ring-4 focus-within:ring-[var(--coral)]/10",
          )}
        >
          <span className="grid size-11 shrink-0 place-items-center text-muted-foreground transition-colors group-focus-within:text-[var(--coral)]">
            <School size={18} />
          </span>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            onBlur={() =>
              console.log("[ONBOARDING_CLIENT] schoolInput", {
                school: school.trim(),
                length: school.trim().length,
              })
            }
            placeholder="Contoh: SMAN 1 Jakarta"
            autoComplete="off"
            className="h-12 w-full bg-transparent pr-4 text-[15px] outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </section>
    </div>
  );
}
