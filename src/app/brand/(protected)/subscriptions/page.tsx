"use client";

import React, { Suspense, lazy } from "react";
import BrandSubscriptionPage from "./SubscriptionsPage";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Subscription</div>}>
        <BrandSubscriptionPage/>
      </Suspense>
    </div>
  );
}