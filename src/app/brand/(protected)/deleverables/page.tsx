"use client";

import React, { Suspense, lazy } from "react";
import DeliverablesPage from "./Deliverable";

export default function CreateCampaign() {
    return (
    <div>
      <Suspense fallback={<div>Loading Deliverables</div>}>
        <DeliverablesPage/>
      </Suspense>
    </div>
  );
}