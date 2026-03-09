"use client";

import * as React from "react";
import Sidebar from "@/components/ui/influencer/sidebar";
import { SidebarProvider } from "../sidebarContext";

export default function InfluencerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({
      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
      toggle: () => setDrawerOpen((v) => !v),
    }),
    []
  );

  return (
    <SidebarProvider value={value}>
      <div className="h-dvh flex bg-white overflow-hidden">
        <Sidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
