import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayChallenges } from "@/server/actions/challenges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTodayChallenges();
  return NextResponse.json(result);
}
