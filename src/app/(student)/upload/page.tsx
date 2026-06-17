import { redirect } from "next/navigation";
import { UploadPageClient } from "@/components/student/upload-page-client";
import { auth } from "@/lib/auth";
import { listDocuments } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const result = await listDocuments();
  const initial = result.ok ? result.documents : [];

  return <UploadPageClient initialDocuments={initial} />;
}
