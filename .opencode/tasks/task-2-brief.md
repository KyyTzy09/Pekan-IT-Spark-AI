# Task 2: Create Tree Server Page

**Files:**
- Create: `src/app/(student)/tree/page.tsx`

**Interfaces:**
- Consumes: `getDashboardSummary(userId)`, `getStudyBuddyAction()`, `auth()`
- Produces: `<Tree3DView>` with flat props: `level`, `totalXp`, `totalMastered`, `totalConcepts`, `avgMasteryPct`, `buddyType`

**Steps:**

- [ ] **Step 1: Write the server page**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/server/actions/dashboard";
import { getStudyBuddyAction } from "@/server/actions/gamification";
import { Tree3DView } from "@/components/student/tree-3d-view";

export const metadata: Metadata = {
  title: "Pohon Kehidupan — Spark AI",
  description: "Lihat pertumbuhan pohon belajarmu dalam 3D.",
};

export const dynamic = "force-dynamic";

export default async function TreePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const userId = session.user.id;

  const [summary, buddy] = await Promise.all([
    getDashboardSummary(userId).catch(() => null),
    getStudyBuddyAction().catch(() => null),
  ]);

  if (!summary) redirect("/dashboard");

  const totalConcepts = summary.totalConcepts || 1;
  const avgMasteryPct = Math.round(
    (summary.totalMastered / totalConcepts) * 100,
  );

  return (
    <Tree3DView
      level={summary.level.level}
      totalXp={summary.level.totalXp}
      totalMastered={summary.totalMastered}
      totalConcepts={summary.totalConcepts}
      avgMasteryPct={avgMasteryPct}
      buddyType={buddy?.buddy?.type ?? "bunga"}
    />
  );
}
```

IMPORTANT NOTES:
- The file path uses `(student)` as a route group with parentheses
- Do NOT import `prisma` — it's not needed, `getDashboardSummary` and `getStudyBuddyAction` handle DB access
- `getStudyBuddyAction()` returns `{ ok: true, buddy: { type: string, stage: number } }` — access type via `buddy?.buddy?.type`
- The `Tree3DView` component doesn't exist yet (created in Task 3), so typecheck will fail until Task 3 is done. That's expected.

## Global Constraints

- No streak in tree metrics
- Buddy type affects canopy color only (not tree shape)
- No `.glb` or external 3D assets
