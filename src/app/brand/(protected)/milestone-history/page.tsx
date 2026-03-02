"use client";

import React, { Suspense, lazy } from "react";
import MilestoneHistoryPage from "./Milestone";

export default function ViewInfluencer() {
    return (
    <div>
      <Suspense fallback={<div>Loading Milestone</div>}>
        <MilestoneHistoryPage/>
      </Suspense>
    </div>
  );
}