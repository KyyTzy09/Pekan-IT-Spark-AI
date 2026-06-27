import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  generateAndStoreDailyChallenges,
  getTodayChallenges,
} from "@/server/actions/challenges";

/** Start of today in UTC (matches challenges.ts startOfToday) */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTodayChallenges();
  if (result.challenges.length === 0) {
    generateAndStoreDailyChallenges(session.id, startOfTodayUtc()).catch(
      console.error,
    );
  }
  return NextResponse.json(result);
}
