"use client";

import React, { useState } from "react";
import BrandSidebar from "@/components/ui/brand/brandSidebar";
import BrandTopbar from "@/components/ui/brand/brandTopbar";
import { BrandTopbarProvider, useBrandTopbar } from "@/components/ui/brand/brandTopbarProvider";
import { ToastStyles } from "../toast";

function Inner({ children }: { children: React.ReactNode }) {
  const { actions } = useBrandTopbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <div className="shrink-0 h-full overflow-visible relative z-50">
        <BrandSidebar drawerOpen={drawerOpen} setDrawerOpen={(open) => setDrawerOpen(open)} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative z-0">
        <div className="shrink-0 overflow-hidden">
          <BrandTopbar
            actionsOverride={actions}
            onMenuToggle={() => setDrawerOpen((v) => !v)}
          />
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
          <ToastStyles />
        </div>
      </div>
    </div>
  );
}

export default function BrandScaffold({ children }: { children: React.ReactNode }) {
  return (
    <BrandTopbarProvider>
      <Inner>{children}</Inner>
    </BrandTopbarProvider>
  );
}