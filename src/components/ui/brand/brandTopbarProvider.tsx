"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ActionBase = {
  key: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;

  /** ✅ new */
  label?: string;
  icon?: React.ReactNode;
  className?: string;
};

export type TopbarAction =
  | (ActionBase & { href: string })
  | (ActionBase & { onClick: () => void })
  | (ActionBase & { static: true });

type Ctx = {
  actions: TopbarAction[];
  setActions: (actions: TopbarAction[]) => void;
  clearActions: () => void;
};

const BrandTopbarCtx = createContext<Ctx | null>(null);

export function BrandTopbarProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActionsState] = useState<TopbarAction[]>([]);

  const setActions = useCallback((a: TopbarAction[]) => setActionsState(a), []);
  const clearActions = useCallback(() => setActionsState([]), []);

  const value = useMemo(() => ({ actions, setActions, clearActions }), [actions, setActions, clearActions]);

  return <BrandTopbarCtx.Provider value={value}>{children}</BrandTopbarCtx.Provider>;
}

export function useBrandTopbar() {
  const ctx = useContext(BrandTopbarCtx);
  if (!ctx) throw new Error("useBrandTopbar must be used inside BrandTopbarProvider");
  return ctx;
}
