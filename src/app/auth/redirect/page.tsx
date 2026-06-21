import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { sanitizeInternalPath } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const { role, isOnboarded } = session;
  const params = await searchParams;
  const safe = sanitizeInternalPath(params.callbackUrl);
  if (safe) {
    redirect(safe);
  }

  if (role === "STUDENT") {
    redirect(isOnboarded ? "/dashboard" : "/onboarding");
  }
  if (role === "PARENT") {
    redirect("/parent");
  }
  if (role === "ADMIN") {
    redirect("/admin");
  }
  redirect("/");
}
