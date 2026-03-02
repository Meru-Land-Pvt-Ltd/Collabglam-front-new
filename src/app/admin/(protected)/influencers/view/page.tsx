"use client";

import React, { Suspense, lazy } from "react";
import ViewInfluencerPage from "./view-Influencer";

export default function viewInfluencers() {

  return (
    <div>
      <Suspense fallback={<div>Loading Influencers</div>}>
        <ViewInfluencerPage/>
      </Suspense>
    </div>
  );
}