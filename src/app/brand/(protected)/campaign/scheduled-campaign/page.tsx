"use client";

import { Suspense } from "react";
import ScheduledCampaignsClient from "./ScheduleCampaignsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ScheduledCampaignsClient />
    </Suspense>
  );
}
