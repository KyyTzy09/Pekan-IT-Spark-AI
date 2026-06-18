"use client";

import { GraduationCap, HeartHandshake, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthRole = "STUDENT" | "PARENT";

type RoleCard = {
  id: AuthRole;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
};

const ROLE_CARDS: RoleCard[] = [
  {
    id: "STUDENT",
    icon: GraduationCap,
    label: "Siswa",
    desc: "Belajar dengan tutor AI",
    color: "var(--coral)",
  },
  {
    id: "PARENT",
    icon: HeartHandshake,
    label: "Orang Tua",
    desc: "Pantau progress anak",
    color: "var(--blue)",
  },
];

export function AuthRoleSelector({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (next: AuthRole) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pilih peran"
      className="grid grid-cols-2 gap-3"
    >
      {ROLE_CARDS.map((card) => {
        const isSelected = value === card.id;
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(card.id)}
            className={cn(
              "group/role relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98]",
              isSelected
                ? "border-[var(--coral)] bg-[var(--coral)]/5 ring-2 ring-[var(--coral)]/20 shadow-sm"
                : "border-border/40 bg-card/40 hover:border-border/70 hover:bg-card/60",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-md"
                  : "bg-muted/60 text-muted-foreground group-hover/role:bg-muted",
              )}
              style={
                isSelected && card.id === "PARENT"
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, var(--blue), color-mix(in oklch, var(--blue) 70%, white))",
                    }
                  : undefined
              }
            >
              <Icon size={18} strokeWidth={2.5} />
            </span>
            <div className="space-y-0.5">
              <p className="text-[13.5px] font-bold leading-tight text-foreground">
                {card.label}
              </p>
              <p className="text-[11.5px] font-medium leading-snug text-muted-foreground">
                {card.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
