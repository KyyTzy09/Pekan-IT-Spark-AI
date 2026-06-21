import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { startQuizSession } from "@/server/actions/practice";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const result = await startQuizSession(body);
  return NextResponse.json(result);
}
