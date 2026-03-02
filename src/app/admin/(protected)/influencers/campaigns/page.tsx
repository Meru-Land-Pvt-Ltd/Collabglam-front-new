"use client";

import React, { Suspense, lazy } from "react";
import InfluencerCampaignsPage from "./view-Campaign";

export default function viewInfluencers() {

  return (
    <div>
      <Suspense fallback={<div>Loading Campaign</div>}>
        <InfluencerCampaignsPage />
      </Suspense>
    </div>
  );
}