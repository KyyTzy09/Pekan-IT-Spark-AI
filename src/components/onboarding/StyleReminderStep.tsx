import {
  Bell,
  BellOff,
  BookOpen,
  MessageSquareQuote,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LearningStyle =
  | "VISUAL"
  | "TEXTUAL"
  | "EXAMPLE_HEAVY"
  | "SOCRATIC";

const LEARNING_STYLES: Array<{
  value: LearningStyle;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Gambar & diagram",
    icon: Sparkles,
    accent: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Bacaan tertulis",
    icon: BookOpen,
    accent: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Contoh soal",
    icon: Target,
    accent: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Dipandu pertanyaan",
    icon: MessageSquareQuote,
    accent: "from-[var(--yellow)] to-[var(--orange)]",
  },
];

const PRESET_TIMES = [
  { label: "Pagi", value: "07:00", emoji: "🌅" },
  { label: "Siang", value: "12:30", emoji: "☀️" },
  { label: "Sore", value: "16:30", emoji: "🌇" },
  { label: "Malam", value: "19:30", emoji: "🌙" },
];

export function StyleReminderStep({
  learningStyle,
  setLearningStyle,
  reminderEnabled,
  setReminderEnabled,
  reminderTime,
  setReminderTime,
}: {
  learningStyle: LearningStyle | null;
  setLearningStyle: (v: LearningStyle) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderTime: string;
  setReminderTime: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[12px] font-semibold text-foreground/80">
          Gaya belajar
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {LEARNING_STYLES.map((s) => {
            const active = learningStyle === s.value;
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setLearningStyle(s.value)}
                className={cn(
                  "group/style relative flex flex-col items-start gap-1.5 rounded-2xl border bg-card/40 p-3.5 text-left transition-all",
                  active
                    ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 hover:border-border/70 hover:bg-card/60",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/style:-translate-y-0.5",
                      s.accent,
                    )}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white"
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="font-heading text-[14px] font-bold text-foreground">
                  {s.label}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  {s.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-foreground/80">
          <span>Reminder (opsional)</span>
          <span className="text-[10.5px] font-normal text-muted-foreground">
            Boleh di-skip
          </span>
        </p>
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
            reminderEnabled
              ? "border-[var(--coral)]/40 bg-[var(--coral)]/5"
              : "border-border/40 bg-card/60",
          )}
        >
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all",
              reminderEnabled
                ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_8px_20px_rgba(225,29,72,0.35)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {reminderEnabled ? (
              <Bell size={15} strokeWidth={2.5} />
            ) : (
              <BellOff size={15} strokeWidth={2.5} />
            )}
          </span>
          <div className="flex-1">
            <p className="font-heading text-[13px] font-bold text-foreground">
              {reminderEnabled ? `Aktif jam ${reminderTime}` : "Reminder mati"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              Maks 1 per hari, cuma kamu yang bisa aktifin
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              reminderEnabled ? "bg-[var(--coral)]" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-transform",
                reminderEnabled ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {PRESET_TIMES.map((p) => {
              const active = reminderTime === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setReminderTime(p.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-2xl border p-2 text-left transition-colors",
                    active
                      ? "border-transparent bg-[var(--coral)]/8 ring-2 ring-[var(--coral)]/40"
                      : "border-border/40 bg-card/40 hover:border-border/70",
                  )}
                >
                  <span className="text-[14px]">{p.emoji}</span>
                  <span className="text-[9.5px] font-semibold text-foreground/80">
                    {p.label}
                  </span>
                  <span className="font-heading text-[11.5px] font-bold text-foreground">
                    {p.value}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ size = 11, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
