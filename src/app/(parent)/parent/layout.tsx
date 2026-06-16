import { redirect } from "next/navigation";
import type * as React from "react";
import { ParentSidebar } from "@/components/parent/parent-sidebar";
import { auth } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "PARENT") {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      />
      <ParentSidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 lg:pl-72">
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
