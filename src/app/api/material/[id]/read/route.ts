import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markMaterialRead } from "@/server/actions/challenges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
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
