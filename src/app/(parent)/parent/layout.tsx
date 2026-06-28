import { redirect } from "next/navigation";
import type * as React from "react";
import { ParentSidebar } from "@/components/parent/parent-sidebar";
import { getSession } from "@/lib/session";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "PARENT") {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      />
      <ParentSidebar user={{ name: session.name, email: session.email }} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">
        <main
          role="main"
          aria-label="Konten orang tua"
          id="main-content"
          className="flex-1"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
