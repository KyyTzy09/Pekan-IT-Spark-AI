import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMaterialLibrary } from "@/server/actions/challenges";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 30);
  const offset = Number(searchParams.get("offset") ?? 0);
  const result = await getMaterialLibrary({ subjectId, limit, offset });
  return NextResponse.json(result);
}
