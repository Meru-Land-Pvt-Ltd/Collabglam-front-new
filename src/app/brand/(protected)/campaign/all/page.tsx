"use client";

import { Suspense } from "react";
import AllCampaignsClient from "./AllCampaignsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <AllCampaignsClient/>
    </Suspense>
  );
}
