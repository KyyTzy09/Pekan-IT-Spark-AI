import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getSession } from "@/lib/session";
import { getAdminStats } from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();
  return <AdminDashboard stats={stats} adminName={session.name ?? "Admin"} />;
}
