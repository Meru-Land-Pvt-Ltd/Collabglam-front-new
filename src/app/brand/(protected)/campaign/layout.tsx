"use client";

import { Suspense } from "react";
import CampaignNavBarGate from "./CampaignNavBarGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Suspense fallback={null}>
        <CampaignNavBarGate />
      </Suspense>

      {children}
    </div>
  );
}
