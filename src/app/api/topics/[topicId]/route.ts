import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopicDetail } from "@/server/actions/dashboard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { topicId } = await params;
  const summary = await getTopicDetail(topicId, session.id);
  if (!summary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(summary);
}
