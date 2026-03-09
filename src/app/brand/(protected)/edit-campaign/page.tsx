"use client";

import React, { Suspense, lazy } from "react";
import EditCampaignPage from "./EditCampaign";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Campaign</div>}>
        <EditCampaignPage/>
      </Suspense>
    </div>
  );
}