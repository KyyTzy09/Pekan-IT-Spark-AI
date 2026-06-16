import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateOnDemand } from "@/server/actions/challenges";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await generateOnDemand(body ?? {});
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
