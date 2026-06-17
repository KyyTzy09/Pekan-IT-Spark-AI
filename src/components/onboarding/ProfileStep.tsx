import { School } from "lucide-react";
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
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-foreground/80">
          Jenjang
        </label>
        <div className="flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
          {(["SMA", "SMK"] as const).map((opt) => {
            const active = educationLevel === opt;
            return (
              <label
                key={opt}
                htmlFor={`edu-${opt}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70 hover:bg-muted/60",
                )}
              >
                <input
                  id={`edu-${opt}`}
                  type="radio"
                  name="educationLevel"
                  value={opt}
                  checked={active}
                  onChange={() => setEducationLevel(opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-foreground/80">
          Kelas
        </label>
        <div className="flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
          {([10, 11, 12] as const).map((g) => {
            const active = grade === g;
            return (
              <label
                key={g}
                htmlFor={`grade-${g}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70 hover:bg-muted/60",
                )}
              >
                <input
                  id={`grade-${g}`}
                  type="radio"
                  name="grade"
                  value={g}
                  checked={active}
                  onChange={() => setGrade(g)}
                  className="sr-only"
                />
                Kelas {g}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="school"
          className="mb-1.5 block text-[12px] font-semibold text-foreground/80"
        >
          Sekolah
        </label>
        <div className="group/field relative flex items-center rounded-2xl border border-transparent bg-input/40 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
          <span className="grid size-8 place-items-center text-muted-foreground">
            <School size={15} />
          </span>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Nama sekolahmu"
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-2xl bg-transparent pr-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80"
          />
        </div>
      </div>
    </div>
  );
}
