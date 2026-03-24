"use client";

import { Suspense } from "react";
import ViewCampaignInvitation from "./campaign-invitations";

export default function CampaignInvitation() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ViewCampaignInvitation />
    </Suspense>
  );
}
