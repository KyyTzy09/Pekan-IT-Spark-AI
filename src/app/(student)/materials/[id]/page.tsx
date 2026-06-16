import { notFound, redirect } from "next/navigation";
import { MaterialReaderClient } from "@/components/student/materials/material-reader-client";
import { auth } from "@/lib/auth";
import {
  getMaterialDetail,
  markMaterialRead,
} from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const detail = await getMaterialDetail(id);
  if (!detail) notFound();

  async function handleMarkRead(
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) {
    "use server";
    return markMaterialRead({ materialId, readSeconds, completed });
  }

  return <MaterialReaderClient material={detail} onMarkRead={handleMarkRead} />;
}
