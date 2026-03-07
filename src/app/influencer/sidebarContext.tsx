"use client";

import * as React from "react";

type SidebarContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarCtx = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarContextValue;
}) {
  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
