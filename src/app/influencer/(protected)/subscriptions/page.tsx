"use client";

import React, { Suspense, lazy } from "react";
import InfluencerSubscriptionPage from "./InfluencerSubscription";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Subscription</div>}>
        <InfluencerSubscriptionPage/>
      </Suspense>
    </div>
  );
}