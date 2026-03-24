"use client";

import React, { useState } from "react";
import BrandSidebar from "./brandSidebar";
import BrandTopbar from "./brandTopbar";
import { BrandTopbarProvider, useBrandTopbar } from "./brandTopbarProvider";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { actions } = useBrandTopbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-white overflow-hidden">
      <BrandSidebar drawerOpen={drawerOpen} setDrawerOpen={(open) => setDrawerOpen(open)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <BrandTopbar
          actionsOverride={actions}
          onMenuToggle={() => setDrawerOpen((v) => !v)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default function BrandShell({ children }: { children: React.ReactNode }) {
  return (
    <BrandTopbarProvider>
      <ShellInner>{children}</ShellInner>
    </BrandTopbarProvider>
  );
}
