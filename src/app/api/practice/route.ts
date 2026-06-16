import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getNextPracticeQuestion,
  getPracticeStats,
} from "@/server/actions/practice";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId") ?? undefined;
  const [nextResult, stats] = await Promise.all([
    getNextPracticeQuestion(topicId ? { topicId } : undefined),
    getPracticeStats(),
  ]);
  return NextResponse.json({ nextResult, stats });
}
