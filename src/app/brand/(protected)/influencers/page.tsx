// File: app/brand/(protected)/applied-influencers/page.tsx
"use client";

import React, { Suspense, lazy } from "react";
import MediaKitPage from "./viewMediaKit";
import ManageProfile from "./manageProfile";
export default function appliedInfluencer() {
    return (
    <div>
      <Suspense fallback={<div>Loading ..</div>}>
        <ManageProfile/>
      </Suspense>
    </div>
  );
}
