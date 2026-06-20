import {
  Bell,
  BellOff,
  BookOpen,
  MessageSquareQuote,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LearningStyle = "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC";

const LEARNING_STYLES: Array<{
  value: LearningStyle;
  label: string;
  description: string;
  emoji: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  gradient: string;
  shadow: string;
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Diagram & gambar",
    emoji: "🎨",
    icon: Sparkles,
    gradient: "from-[var(--coral)] to-[var(--orange)]",
    shadow: "0_4px_12px_rgba(225,29,72,0.2)",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Penjelasan tertulis",
    emoji: "📖",
    icon: BookOpen,
    gradient: "from-[var(--blue)] to-[var(--teal)]",
    shadow: "0_4px_12px_rgba(14,165,233,0.2)",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Studi kasus nyata",
    emoji: "💡",
    icon: Target,
    gradient: "from-[var(--purple)] to-[var(--pink)]",
    shadow: "0_4px_12px_rgba(139,92,246,0.2)",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Dipandu pertanyaan",
    emoji: "🗣️",
    icon: MessageSquareQuote,
    gradient: "from-[var(--yellow)] to-[var(--orange)]",
    shadow: "0_4px_12px_rgba(245,158,11,0.2)",
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
      {/* Learning style - large visual cards */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-foreground/80">
          Gaya belajar kamu
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {LEARNING_STYLES.map((s) => {
            const active = learningStyle === s.value;
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setLearningStyle(s.value)}
                className={cn(
                  "group/style relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.97]",
                  active
                    ? "border-transparent shadow-lg ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 bg-card/60 hover:border-border/60 hover:bg-card/80",
                )}
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, oklch(0.97 0.03 350), oklch(0.98 0.02 80))`,
                        boxShadow: `0 0 20px oklch(0.85 0.1 350 / 0.15)`,
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl text-white shadow transition-all duration-300 group-hover/style:-translate-y-0.5 group-hover/style:scale-110",
                      active
                        ? `bg-gradient-to-br ${s.gradient} shadow-[0_6px_16px_rgba(225,29,72,0.3)]`
                        : `bg-gradient-to-br ${s.gradient} opacity-70`,
                    )}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                  </span>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px]">{s.emoji}</span>
                      <p
                        className={cn(
                          "font-heading text-[14px] font-bold transition-colors",
                          active ? "text-[var(--coral)]" : "text-foreground/90",
                        )}
                      >
                        {s.label}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-[10.5px] transition-colors",
                        active
                          ? "text-[var(--coral)]/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {s.description}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {active && (
                    <span className="grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminder section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-foreground/80">
            Reminder belajar
          </p>
          <span className="text-[10px] text-muted-foreground/70">Opsional</span>
        </div>

        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300",
            reminderEnabled
              ? "border-[var(--coral)]/40 bg-gradient-to-r from-[var(--coral)]/5 to-transparent"
              : "border-border/40 bg-card/60",
          )}
        >
          {/* Bell icon */}
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl text-white shadow transition-all duration-300",
              reminderEnabled
                ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_6px_16px_rgba(225,29,72,0.35)]"
                : "bg-muted text-muted-foreground/60",
            )}
          >
            {reminderEnabled ? (
              <Bell size={16} strokeWidth={2.5} />
            ) : (
              <BellOff size={16} strokeWidth={2.5} />
            )}
          </span>

          <div className="flex-1">
            <p className="font-heading text-[14px] font-bold text-foreground">
              {reminderEnabled ? `Aktif · ${reminderTime}` : "Belum aktif"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              {reminderEnabled
                ? "Spark bakal ingetin kamu tiap hari"
                : "Tap switch buat aktifin"}
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300",
              reminderEnabled ? "bg-[var(--coral)]" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full bg-white shadow-md transition-transform duration-300",
                reminderEnabled ? "translate-x-[26px]" : "translate-x-1",
              )}
            />
          </button>
        </div>

        {/* Time presets */}
        {reminderEnabled && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {PRESET_TIMES.map((p) => {
              const active = reminderTime === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setReminderTime(p.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border py-3 transition-all duration-300 active:scale-95",
                    active
                      ? "border-transparent bg-gradient-to-b from-[var(--coral)]/10 to-[var(--coral)]/5 ring-2 ring-[var(--coral)]/40"
                      : "border-border/40 bg-card/60 hover:bg-card/80",
                  )}
                >
                  <span className="text-[16px]">{p.emoji}</span>
                  <span
                    className={cn(
                      "font-heading text-[12px] font-bold transition-colors",
                      active ? "text-[var(--coral)]" : "text-foreground/80",
                    )}
                  >
                    {p.value}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] transition-colors",
                      active
                        ? "text-[var(--coral)]/60"
                        : "text-muted-foreground/60",
                    )}
                  >
                    {p.label}
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
