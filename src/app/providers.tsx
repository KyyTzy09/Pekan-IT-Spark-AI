"use client";

import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GooeyToaster position="bottom-right" theme="dark" />
    </>
  );
}
