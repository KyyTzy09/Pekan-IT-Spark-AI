import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function AuthRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { role, isOnboarded } = session.user;
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
