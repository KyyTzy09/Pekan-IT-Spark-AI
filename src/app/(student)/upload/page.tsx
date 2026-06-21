import { redirect } from "next/navigation";
import { UploadPageClient } from "@/components/student/upload-page-client";
import { getSession } from "@/lib/session";
import { listDocuments } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const result = await listDocuments();
  const initial = result.ok ? result.documents : [];

  return <UploadPageClient initialDocuments={initial} />;
}
