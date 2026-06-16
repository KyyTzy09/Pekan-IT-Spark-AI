import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrGenerateWeeklyPlan } from "@/server/learning-plan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const plan = await getOrGenerateWeeklyPlan(session.user.id);
  return NextResponse.json(plan);
}
