import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { generateOnDemand } from "@/server/actions/challenges";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await generateOnDemand(body ?? {});
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
