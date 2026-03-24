"use client";

import React, { Suspense, lazy } from "react";
import AllDeliverablesPage from "./AllDeliverable";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Deliverables</div>}>
        <AllDeliverablesPage/>
      </Suspense>
    </div>
  );
}