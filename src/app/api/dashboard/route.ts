import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDashboardSummary } from "@/server/actions/dashboard";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await getDashboardSummary(session.id);
  return NextResponse.json(summary);
}
