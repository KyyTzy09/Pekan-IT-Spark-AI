import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTopicDetail } from "@/server/actions/dashboard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { topicId } = await params;
  const summary = await getTopicDetail(topicId, session.user.id);
  if (!summary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(summary);
}
