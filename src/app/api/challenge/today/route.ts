import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  generateAndStoreDailyChallenges,
  getTodayChallenges,
} from "@/server/actions/challenges";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTodayChallenges();
  if (result.challenges.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    generateAndStoreDailyChallenges(session.id, today).catch(
      console.error,
    );
  }
  return NextResponse.json(result);
}
