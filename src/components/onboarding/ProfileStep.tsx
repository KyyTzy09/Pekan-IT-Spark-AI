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
    <div className="space-y-5">
      {/* Education level - visual cards */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-foreground/80">
          Jenjang
        </p>
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
                onClick={() => setEducationLevel(opt.value)}
                className={cn(
                  "group/edu relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.97]",
                  active
                    ? "border-[var(--coral)]/50 bg-gradient-to-br from-[var(--coral)]/10 to-[var(--orange)]/5 shadow-[0_8px_24px_rgba(225,29,72,0.12)] ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 bg-card/60 hover:border-border/60 hover:bg-card/80",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl text-white shadow transition-all duration-300",
                      active
                        ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
                        : "bg-gradient-to-br from-muted to-muted/60 text-muted-foreground",
                    )}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                  </span>
                  <div>
                    <p
                      className={cn(
                        "font-heading text-[15px] font-bold transition-colors",
                        active ? "text-[var(--coral)]" : "text-foreground",
                      )}
                    >
                      {opt.label}
                    </p>
                    <p
                      className={cn(
                        "text-[10.5px] transition-colors",
                        active
                          ? "text-[var(--coral)]/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade - visual pills */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-foreground/80">
          Kelas
        </p>
        <div className="flex gap-2">
          {([10, 11, 12] as const).map((g) => {
            const active = grade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={cn(
                  "flex-1 rounded-2xl border py-3 text-center transition-all duration-300 active:scale-[0.95]",
                  active
                    ? "border-[var(--coral)]/50 bg-gradient-to-br from-[var(--coral)]/10 to-[var(--orange)]/5 shadow-[0_6px_18px_rgba(225,29,72,0.15)] ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 bg-card/60 hover:border-border/60",
                )}
              >
                <p
                  className={cn(
                    "font-heading text-[18px] font-bold transition-colors",
                    active ? "text-[var(--coral)]" : "text-foreground/80",
                  )}
                >
                  {g}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* School - floating label input */}
      <div>
        <div
          className={cn(
            "group/field relative flex items-center rounded-2xl border bg-input/40 p-1 transition-all focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
            school ? "border-ring/30" : "border-border/40",
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors group-focus-within/field:text-[var(--coral)]">
            <School size={16} />
          </span>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder=" "
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-xl bg-transparent px-2.5 text-[14px] outline-none placeholder:text-transparent"
          />
          <label
            htmlFor="school"
            className={cn(
              "pointer-events-none absolute left-12 px-1 text-[13px] text-muted-foreground transition-all",
              school
                ? "-top-2.5 text-[10px] font-bold text-[var(--coral)]"
                : "top-3",
            )}
          >
            Nama sekolahmu
          </label>
        </div>
      </div>
    </div>
  );
}
