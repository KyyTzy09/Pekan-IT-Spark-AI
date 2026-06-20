import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateAndStoreDailyChallenges,
  getTodayChallenges,
} from "@/server/actions/challenges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTodayChallenges();
  if (result.challenges.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    generateAndStoreDailyChallenges(session.user.id, today).catch(
      console.error,
    );
  }
  return NextResponse.json(result);
}
