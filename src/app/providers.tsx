"use client";

import { GooeyToaster } from "goey-toast";
import { SessionProvider } from "next-auth/react";
import "goey-toast/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <GooeyToaster position="bottom-right" theme="dark" />
    </SessionProvider>
  );
}
