import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { auth } from "@/lib/auth";
import { getAdminStats } from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();
  return (
    <AdminDashboard stats={stats} adminName={session.user.name ?? "Admin"} />
  );
}
