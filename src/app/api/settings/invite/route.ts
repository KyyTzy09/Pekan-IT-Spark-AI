import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveInvite, listInvites } from "@/server/actions/invite";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [profile, active, history] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { user: { select: { name: true } } },
    }),
    getActiveInvite(),
    listInvites(),
  ]);
  return NextResponse.json({
    studentName: profile?.user.name ?? session.user.name ?? null,
    activeInvite: active,
    history,
  });
}
