"use client";

import * as React from "react";

export function useQuotaModal() {
  const [open, setOpen] = React.useState(false);
  const [quotaType, setQuotaType] = React.useState("");

  const showQuotaModal = React.useCallback((type: string) => {
    setQuotaType(type);
    setOpen(true);
  }, []);

  const hideQuotaModal = React.useCallback(() => {
    setOpen(false);
  }, []);

  return { open, quotaType, showQuotaModal, hideQuotaModal };
}
