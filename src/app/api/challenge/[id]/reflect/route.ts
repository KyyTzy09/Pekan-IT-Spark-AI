import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { submitReflection } from "@/server/actions/challenges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const result = await submitReflection({
    challengeId: id,
    response: String(body?.response ?? ""),
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
