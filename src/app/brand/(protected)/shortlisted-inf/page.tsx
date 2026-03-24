"use client";

import React, { Suspense, lazy } from "react";
import ShortlistedInfluencersPage from "./ShortlistedInf";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Influencer</div>}>
        <ShortlistedInfluencersPage/>
      </Suspense>
    </div>
  );
}