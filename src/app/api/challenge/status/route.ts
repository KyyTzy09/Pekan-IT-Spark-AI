import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/challenge/status
 * Returns the current generation status for today's challenges.
 * Used by frontend polling to know if generation is in progress.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const tomorrow = new Date(today.getTime() + 86_400_000);

  // Count challenges by status
  const [generating, active, total] = await Promise.all([
    prisma.challenge.count({
      where: {
        userId: session.id,
        type: "DAILY",
        status: "GENERATING",
        scheduledFor: { gte: today, lt: tomorrow },
      },
    }),
    prisma.challenge.count({
      where: {
        userId: session.id,
        type: "DAILY",
        status: "ACTIVE",
        scheduledFor: { gte: today, lt: tomorrow },
      },
    }),
    prisma.challenge.count({
      where: {
        userId: session.id,
        type: "DAILY",
        scheduledFor: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  return NextResponse.json({
    generating: generating > 0,
    active,
    total,
    timestamp: now.toISOString(),
  });
}
