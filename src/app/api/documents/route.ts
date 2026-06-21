import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listDocuments } from "@/server/actions/documents";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await listDocuments();
  return NextResponse.json(result);
}
