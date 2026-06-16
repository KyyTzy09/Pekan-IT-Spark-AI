import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  completeChallengeItem,
  skipChallengeItem,
} from "@/server/actions/challenges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { itemId } = await params;
  const body = await request.json();
  const action = body?.action as "complete" | "skip" | undefined;
  if (action === "skip") {
    const result = await skipChallengeItem({ itemId });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  const result = await completeChallengeItem({
    itemId,
    answer: body?.answer,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
