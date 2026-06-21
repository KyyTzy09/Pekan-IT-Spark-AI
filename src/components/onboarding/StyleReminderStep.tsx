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
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Diagram, gambar, dan ilustrasi membantu kamu memahami konsep",
    emoji: "🎨",
    icon: Sparkles,
    gradient: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Penjelasan tertulis dan membaca materi lebih efektif",
    emoji: "📖",
    icon: BookOpen,
    gradient: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Studi kasus nyata dan contoh konkret memudahkan pemahaman",
    emoji: "💡",
    icon: Target,
    gradient: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Dipandu dengan pertanyaan untuk berpikir kritis",
    emoji: "🗣️",
    icon: MessageSquareQuote,
    gradient: "from-[var(--yellow)] to-[var(--orange)]",
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
    <div className="space-y-8">
      {/* Learning style */}
      <section>
        <label className="mb-3 block text-[13px] font-bold text-foreground">
          Gaya belajar kamu
        </label>
        <div className="grid gap-3">
          {LEARNING_STYLES.map((s) => {
            const active = learningStyle === s.value;
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setLearningStyle(s.value)}
                className={cn(
                  "group relative rounded-xl border-2 p-5 text-left transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "border-[var(--coral)] bg-[var(--coral)]/5 shadow-[0_8px_24px_rgba(225,29,72,0.12)] ring-4 ring-[var(--coral)]/10"
                    : "border-border/60 bg-card/80 hover:border-border hover:bg-card",
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-lg text-white shadow transition-all",
                      active
                        ? `bg-gradient-to-br ${s.gradient} shadow-[0_4px_12px_rgba(225,29,72,0.3)]`
                        : `bg-gradient-to-br ${s.gradient} opacity-70`,
                    )}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px]">{s.emoji}</span>
                      <p
                        className={cn(
                          "font-heading text-[16px] font-bold transition-colors",
                          active ? "text-[var(--coral)]" : "text-foreground",
                        )}
                      >
                        {s.label}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-[12px] leading-relaxed transition-colors",
                        active
                          ? "text-[var(--coral)]/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {s.description}
                    </p>
                  </div>

                  {active && (
                    <span className="grid size-7 place-items-center rounded-full bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]">
                      <svg
                        width="12"
                        height="12"
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
      </section>

      {/* Reminder */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[13px] font-bold text-foreground">
            Reminder belajar
          </label>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Opsional
          </span>
        </div>

        <div
          className={cn(
            "rounded-xl border-2 p-5 transition-all duration-200",
            reminderEnabled
              ? "border-[var(--coral)]/50 bg-[var(--coral)]/5"
              : "border-border/60 bg-card/80",
          )}
        >
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-lg text-white shadow transition-all",
                reminderEnabled
                  ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {reminderEnabled ? (
                <Bell size={20} strokeWidth={2.5} />
              ) : (
                <BellOff size={20} strokeWidth={2.5} />
              )}
            </span>

            <div className="flex-1">
              <p className="font-heading text-[16px] font-bold text-foreground">
                {reminderEnabled ? `Aktif · ${reminderTime}` : "Belum aktif"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {reminderEnabled
                  ? "Spark bakal ingetin kamu tiap hari"
                  : "Aktifkan reminder untuk konsistensi belajar"}
              </p>
            </div>

            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={cn(
                "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300",
                reminderEnabled ? "bg-[var(--coral)]" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-6 rounded-full bg-white shadow-md transition-transform duration-300",
                  reminderEnabled ? "translate-x-[30px]" : "translate-x-1",
                )}
              />
            </button>
          </div>

          {/* Time presets */}
          {reminderEnabled && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {PRESET_TIMES.map((p) => {
                const active = reminderTime === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setReminderTime(p.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 transition-all duration-200 active:scale-95",
                      active
                        ? "border-[var(--coral)] bg-[var(--coral)]/10 ring-4 ring-[var(--coral)]/10"
                        : "border-border/60 bg-card/80 hover:border-border",
                    )}
                  >
                    <span className="text-[18px]">{p.emoji}</span>
                    <span
                      className={cn(
                        "font-heading text-[13px] font-bold transition-colors",
                        active ? "text-[var(--coral)]" : "text-foreground/80",
                      )}
                    >
                      {p.value}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold transition-colors",
                        active
                          ? "text-[var(--coral)]/70"
                          : "text-muted-foreground",
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
      </section>
    </div>
  );
}
