"use client";

import React, { Suspense, lazy } from "react";
import ViewCampaignPage from "./viewCampaign";

export default function viewCampaign() {

  return (
    <div>
      <Suspense fallback={<div>Loading Campaigns</div>}>
        <ViewCampaignPage/>
      </Suspense>
    </div>
  );
}
