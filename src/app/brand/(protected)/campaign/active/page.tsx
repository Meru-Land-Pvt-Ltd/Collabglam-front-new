"use client";

import { Suspense } from "react";
import ActiveCampaignsClient from "./ActiveCampaignsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ActiveCampaignsClient />
    </Suspense>
  );
}
