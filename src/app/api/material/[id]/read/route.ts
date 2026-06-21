import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { markMaterialRead } from "@/server/actions/challenges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await markMaterialRead({
    materialId: id,
    readSeconds: Number(body?.readSeconds ?? 0),
    completed: Boolean(body?.completed ?? false),
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
