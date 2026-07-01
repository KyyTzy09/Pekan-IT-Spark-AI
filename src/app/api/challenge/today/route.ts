import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  generateAndStoreDailyChallenges,
  getTodayChallenges,
} from "@/server/actions/challenges";
import { challengeLog } from "@/lib/logger";

/** Start of today in UTC (matches challenges.ts startOfToday) */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timer = challengeLog.timer("today_request", { userId: session.id });

  const result = await getTodayChallenges();

  if (result.challenges.length === 0) {
    // Check if generation is already in progress (another request / instance)
    const today = startOfTodayUtc();
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const generatingCount = await prisma.challenge.count({
      where: {
        userId: session.id,
        status: "GENERATING",
        scheduledFor: { gte: today, lt: tomorrow },
      },
    });

    if (generatingCount > 0) {
      challengeLog.info("generation_in_progress", { userId: session.id });
      timer({ status: "generating", challengeCount: 0 });
      return NextResponse.json({
        ...result,
        generating: true,
      });
    }

    // Mark as generating — create placeholder challenges
    const distributedSubjects = result.challenges.length; // 0 at this point
    challengeLog.info("generation_start", {
      userId: session.id,
      challengeCount: 0,
    });

    // Fire-and-forget with proper error handling
    generateAndStoreDailyChallenges(session.id, today)
      .then(() => {
        challengeLog.info("generation_complete", { userId: session.id });
      })
      .catch((err) => {
        challengeLog.error(
          "generation_failed",
          { userId: session.id },
          err instanceof Error ? err.message : String(err),
        );
      });

    timer({ status: "triggered", challengeCount: 0 });
    return NextResponse.json({
      ...result,
      generating: true,
    });
  }

  timer({ status: "ok", challengeCount: result.challenges.length });
  return NextResponse.json(result);
}
