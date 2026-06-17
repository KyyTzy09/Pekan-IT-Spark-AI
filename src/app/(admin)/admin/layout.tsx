import type * as React from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, oklch(0.95 0.02 250 / 0.6), transparent 50%), radial-gradient(circle at 100% 100%, oklch(0.94 0.03 280 / 0.5), transparent 50%)",
        }}
      />
      <AdminNav />
      <main
        role="main"
        aria-label="Konten admin"
        id="main-content"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
