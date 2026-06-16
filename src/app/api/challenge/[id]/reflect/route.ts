import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitReflection } from "@/server/actions/challenges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
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
