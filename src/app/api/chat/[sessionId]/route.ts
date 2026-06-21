import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getChatMessages, getChatSession } from "@/server/actions/chat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sessionId } = await params;
  const chatSession = await getChatSession(sessionId);
  if (!chatSession || chatSession.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await getChatMessages(sessionId);
  return NextResponse.json({ chatSession, messages });
}
