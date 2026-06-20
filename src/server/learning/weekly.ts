import "server-only";

export type WeeklyItemCounts = {
  questions: number;
  materials: number;
};

export function computeWeeklyItemCounts(
  strength: "weak" | "balanced" | "strong",
): WeeklyItemCounts {
  if (strength === "weak") return { questions: 2, materials: 2 };
  if (strength === "strong") return { questions: 4, materials: 1 };
  return { questions: 3, materials: 1 };
}
