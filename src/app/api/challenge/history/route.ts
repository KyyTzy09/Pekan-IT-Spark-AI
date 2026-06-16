import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChallengeHistory } from "@/server/actions/challenges";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);
  const result = await getChallengeHistory({ limit, offset });
  return NextResponse.json(result);
}
