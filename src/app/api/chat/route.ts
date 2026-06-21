import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listChatSessions } from "@/server/actions/chat";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [subjects, sessions] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    }),
    listChatSessions(),
  ]);
  return NextResponse.json({
    subjects,
    sessions,
    userName: session.name ?? "Teman",
  });
}
