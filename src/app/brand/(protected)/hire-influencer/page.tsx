"use client";

import React, { Suspense, lazy } from "react";
import HireInfluencerPage from "./HireInf";

export default function HireInfluencer() {
    return (
    <div>
      <Suspense fallback={<div>Loading Hiring Page</div>}>
        <HireInfluencerPage/>
      </Suspense>
    </div>
  );
}