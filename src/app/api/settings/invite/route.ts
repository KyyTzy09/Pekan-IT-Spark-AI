import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getActiveInvite, listInvites } from "@/server/actions/invite";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [profile, active, history] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.id },
      select: { user: { select: { name: true } } },
    }),
    getActiveInvite(),
    listInvites(),
  ]);
  return NextResponse.json({
    studentName: profile?.user.name ?? session.name ?? null,
    activeInvite: active,
    history,
  });
}
