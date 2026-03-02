"use client";

import React, { Suspense, lazy } from "react";
import ActiveInfluencersPage from "./activeInf";

export default function activeInfluencer() {
    return (
    <div>
      <Suspense fallback={<div>Loading Influencers</div>}>
        <ActiveInfluencersPage/>
      </Suspense>
    </div>
  );
}
