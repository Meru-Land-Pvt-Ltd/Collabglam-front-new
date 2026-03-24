// File: app/brand/(protected)/applied-influencers/page.tsx
"use client";

import React, { Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import ViewBrandProfilePage from "./viewBrand";

export default function appliedInfluencer() {
  return (
    <div>
      <Suspense fallback={<div>Loading influencers…</div>}>
        <ViewBrandProfilePage/>
      </Suspense>
    </div>
  );
}
