"use client";

import { Suspense } from "react";
import ViewCampaignPage from "./viewCampaign";

export default function ViewCampaign() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ViewCampaignPage />
    </Suspense>
  );
}
