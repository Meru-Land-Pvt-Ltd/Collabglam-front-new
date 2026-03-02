"use client";

import React, { Suspense, lazy } from "react";
import ViewCampaignPage from "./ViewCampaign";

export default function ViewCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Campaign Page</div>}>
        <ViewCampaignPage/>
      </Suspense>
    </div>
  );
}