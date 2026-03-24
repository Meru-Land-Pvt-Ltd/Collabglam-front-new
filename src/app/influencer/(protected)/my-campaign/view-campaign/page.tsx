// File: app/brand/(protected)/applied-influencers/page.tsx
"use client";

import React, { Suspense, lazy } from "react";
import ViewCampaignPage from "./viewCampaign";

export default function appliedInfluencer() {
  return (
    <div>
      <Suspense fallback={<div>Loading influencers…</div>}>
        <ViewCampaignPage/>
      </Suspense>
    </div>
  );
}
