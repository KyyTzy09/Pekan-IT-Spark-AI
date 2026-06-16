import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDailyProgress } from "@/server/actions/challenges";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : undefined;
  const result = await getDailyProgress(date);
  return NextResponse.json(result);
}
