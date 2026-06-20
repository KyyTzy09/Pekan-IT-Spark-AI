"use client";

import * as React from "react";

type EnrollContextValue = {
  open: () => void;
};

const EnrollContext = React.createContext<EnrollContextValue | null>(null);

export function EnrollProvider({ children }: { children: React.ReactNode }) {
  const open = React.useCallback(() => {
    window.location.href = "/auth/register";
  }, []);
  const ctx = React.useMemo(() => ({ open }), [open]);
  return (
    <EnrollContext.Provider value={ctx}>{children}</EnrollContext.Provider>
  );
}

export function useEnroll() {
  const ctx = React.useContext(EnrollContext);
  if (!ctx) {
    return { open: () => (window.location.href = "/auth/register") };
  }
  return ctx;
}
