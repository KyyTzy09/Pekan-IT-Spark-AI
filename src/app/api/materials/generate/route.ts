import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateOnDemandMaterial } from "@/server/actions/materials";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await generateOnDemandMaterial(body ?? {});
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
