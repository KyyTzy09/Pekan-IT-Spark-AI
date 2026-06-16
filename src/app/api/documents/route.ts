import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDocuments } from "@/server/actions/documents";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await listDocuments();
  return NextResponse.json(result);
}
